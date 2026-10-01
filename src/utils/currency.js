/**
 * Currency formatting. Amounts are stored as plain numbers (e.g. 5000) and only
 * formatted for display here — never build currency strings by hand elsewhere.
 * Changing the currency setting changes the display symbol; amounts are not converted.
 */

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', locale: 'en-IE', label: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound' },
};

export const DEFAULT_CURRENCY = 'INR';

export const CURRENCY_CODES = Object.keys(CURRENCIES);

export const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${code} ${CURRENCIES[code].symbol} — ${CURRENCIES[code].label}`,
}));

const formatterCache = new Map();

function getFormatter(code, options) {
  const key = `${code}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCIES[code].locale, {
      style: 'currency',
      currency: code,
      ...options,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function resolveCode(code) {
  return CURRENCIES[code] ? code : DEFAULT_CURRENCY;
}

export function getCurrencySymbol(code) {
  return CURRENCIES[resolveCode(code)].symbol;
}

/**
 * formatCurrency(125000) → "₹1,25,000"; formatCurrency(450.5) → "₹450.50".
 * Whole amounts drop the decimals; fractional amounts always show two.
 * `compact` gives axis-friendly values such as "₹1.3L" or "$12K".
 */
export function formatCurrency(amount, code = DEFAULT_CURRENCY, { compact = false, signDisplay = 'auto' } = {}) {
  const currency = resolveCode(code);
  const value = Number.isFinite(amount) ? amount : 0;

  if (compact) {
    return getFormatter(currency, {
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      signDisplay,
    }).format(value);
  }

  const hasFraction = Math.round(Math.abs(value) * 100) % 100 !== 0;
  const digits = hasFraction ? 2 : 0;
  return getFormatter(currency, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay,
  }).format(value);
}

/** "+₹60,000" for income, "-₹450" (with a true minus sign) for expenses. */
export function formatTransactionAmount(amount, type, code = DEFAULT_CURRENCY) {
  const sign = type === 'income' ? '+' : '\u2212';
  return `${sign}${formatCurrency(Math.abs(amount), code)}`;
}

/** "-12.5%" style percentage with one decimal, or null when not computable. */
export function formatPercent(value, { signed = false, digits = 1 } = {}) {
  if (!Number.isFinite(value)) return null;
  const rounded = Number(value.toFixed(digits));
  const sign = signed && rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('en-IN', { maximumFractionDigits: digits })}%`;
}
