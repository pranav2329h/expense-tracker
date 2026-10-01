/**
 * Date handling.
 *
 * A transaction's date is a calendar day, not an instant, so it is stored as a
 * "yyyy-MM-dd" string ("date key"). Date keys sort lexicographically, support
 * Firestore range queries, and never shift when the same data is viewed from a
 * different timezone. createdAt/updatedAt remain Firestore server timestamps.
 */
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isToday,
  isValid,
  isYesterday,
  parse,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';

export const DATE_KEY_FORMAT = 'yyyy-MM-dd';
export const MONTH_KEY_FORMAT = 'yyyy-MM';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function toDateKey(date) {
  return format(date, DATE_KEY_FORMAT);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function yesterdayKey() {
  return toDateKey(subDays(new Date(), 1));
}

/** Local-midnight Date for a date key. Use for display and date math only. */
export function parseDateKey(key) {
  return parse(key, DATE_KEY_FORMAT, new Date());
}

/** True for real calendar dates only (rejects "2026-02-30"). */
export function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;
  const date = parseDateKey(value);
  return isValid(date) && toDateKey(date) === value;
}

export function isValidMonthKey(value) {
  if (typeof value !== 'string' || !MONTH_KEY_PATTERN.test(value)) return false;
  const date = parse(value, MONTH_KEY_FORMAT, new Date());
  return isValid(date) && format(date, MONTH_KEY_FORMAT) === value;
}

export function toMonthKey(dateKey) {
  return dateKey.slice(0, 7);
}

export function currentMonthKey() {
  return format(new Date(), MONTH_KEY_FORMAT);
}

function parseMonthKey(monthKey) {
  return parse(monthKey, MONTH_KEY_FORMAT, new Date());
}

export function shiftMonthKey(monthKey, delta) {
  return format(addMonths(parseMonthKey(monthKey), delta), MONTH_KEY_FORMAT);
}

export function getMonthRange(monthKey) {
  const date = parseMonthKey(monthKey);
  return { startDate: toDateKey(startOfMonth(date)), endDate: toDateKey(endOfMonth(date)) };
}

export function formatDate(dateKey, pattern = 'dd MMM yyyy') {
  return format(parseDateKey(dateKey), pattern);
}

export function formatDayHeading(dateKey) {
  const date = parseDateKey(dateKey);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, dd MMM yyyy');
}

export function formatMonthKey(monthKey, pattern = 'MMMM yyyy') {
  return format(parseMonthKey(monthKey), pattern);
}

/** Month keys oldest → newest, ending with the current month. */
export function getRecentMonthKeys(count, now = new Date()) {
  return Array.from({ length: count }, (_, index) =>
    format(subMonths(now, count - 1 - index), MONTH_KEY_FORMAT),
  );
}

/** First day of the live "recent" window (start of the month `months - 1` months ago). */
export function getWindowStartKey(months, now = new Date()) {
  return toDateKey(startOfMonth(subMonths(now, months - 1)));
}

export function getMonthKeysInRange(startDate, endDate) {
  return eachMonthOfInterval({ start: parseDateKey(startDate), end: parseDateKey(endDate) }).map((d) =>
    format(d, MONTH_KEY_FORMAT),
  );
}

export function getDayKeysInRange(startDate, endDate) {
  return eachDayOfInterval({ start: parseDateKey(startDate), end: parseDateKey(endDate) }).map(toDateKey);
}

export function countDaysInRange(startDate, endDate) {
  return differenceInCalendarDays(parseDateKey(endDate), parseDateKey(startDate)) + 1;
}

/**
 * Days of the range that have elapsed (for "average daily expense"): a range that
 * includes today counts up to today; a past range counts in full. Minimum 1.
 */
export function countElapsedDays(startDate, endDate, now = new Date()) {
  const today = toDateKey(now);
  if (startDate > today) return 1;
  const effectiveEnd = endDate < today ? endDate : today;
  return Math.max(1, countDaysInRange(startDate, effectiveEnd));
}

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'last-6-months', label: 'Last 6 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-12-months', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

const PRESET_VALUES = new Set(DATE_PRESETS.map((preset) => preset.value));

export function isDatePreset(value) {
  return PRESET_VALUES.has(value);
}

export function getPresetLabel(value) {
  return DATE_PRESETS.find((preset) => preset.value === value)?.label ?? 'Custom range';
}

/**
 * Resolves a preset to inclusive date keys. "all" returns nulls (no bound).
 * "custom" uses the provided keys when valid, ordering them if reversed.
 */
export function resolveDateRange(preset, { from, to } = {}, now = new Date()) {
  const month = (date) => ({ startDate: toDateKey(startOfMonth(date)), endDate: toDateKey(endOfMonth(date)) });

  switch (preset) {
    case 'today':
      return { startDate: toDateKey(now), endDate: toDateKey(now) };
    case 'this-week':
      return {
        startDate: toDateKey(startOfWeek(now, { weekStartsOn: 1 })),
        endDate: toDateKey(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case 'this-month':
      return month(now);
    case 'last-month':
      return month(subMonths(now, 1));
    case 'last-3-months':
      return { startDate: toDateKey(startOfMonth(subMonths(now, 2))), endDate: toDateKey(endOfMonth(now)) };
    case 'last-6-months':
      return { startDate: toDateKey(startOfMonth(subMonths(now, 5))), endDate: toDateKey(endOfMonth(now)) };
    case 'this-year':
      return { startDate: toDateKey(startOfYear(now)), endDate: toDateKey(endOfYear(now)) };
    case 'last-12-months':
      return { startDate: toDateKey(startOfMonth(subMonths(now, 11))), endDate: toDateKey(endOfMonth(now)) };
    case 'custom': {
      const start = isValidDateKey(from) ? from : null;
      const end = isValidDateKey(to) ? to : null;
      if (start && end && start > end) return { startDate: end, endDate: start };
      return { startDate: start, endDate: end };
    }
    default:
      return { startDate: null, endDate: null };
  }
}

/** Human label for a resolved range, e.g. "01 Oct – 31 Oct 2026". */
export function formatRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return 'All time';
  if (startDate && !endDate) return `From ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Until ${formatDate(endDate)}`;
  if (startDate === endDate) return formatDate(startDate);
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  return `${formatDate(startDate, sameYear ? 'dd MMM' : 'dd MMM yyyy')} – ${formatDate(endDate)}`;
}
