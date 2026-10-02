/**
 * Input validation and sanitising. Used by forms (for inline errors), by the
 * services right before every Firestore write, and by backup import. The same
 * constraints are enforced again server-side in firestore.rules.
 */
import { CURRENCY_CODES } from './currency';
import { isValidDateKey } from './dates';
import { LEDGER_DIRECTIONS, LIMITS, PAYMENT_METHOD_VALUES, THEME_PREFERENCES, TRANSACTION_TYPES } from './constants';
import { isCategoryIconKey } from './categoryIcons';

const DOC_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const AMOUNT_PATTERN = /^(\d+(\.\d*)?|\.\d+)$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidDocId(value) {
  return typeof value === 'string' && DOC_ID_PATTERN.test(value);
}

/** Collapses whitespace, strips control characters and trims. Returns '' for non-strings. */
export function cleanText(value) {
  if (typeof value !== 'string') return '';
  const collapsed = value.replace(/\s+/g, ' ');
  let result = '';
  for (const char of collapsed) {
    const code = char.codePointAt(0);
    if (code >= 32 && code !== 127) result += char;
  }
  return result.trim();
}

/**
 * Parses user-typed amounts such as "1,25,000" or "450.50". Rejects anything that
 * is not a plain positive decimal (e.g. "1e5", "-5", "Infinity", "0x10") with NaN.
 */
export function parseAmount(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;
  const normalized = value.replace(/[,\s]/g, '');
  if (!AMOUNT_PATTERN.test(normalized)) return Number.NaN;
  return Number(normalized);
}

export function validateAmount(raw) {
  if (raw === '' || raw === null || raw === undefined) return { error: 'Enter an amount.' };
  const amount = parseAmount(raw);
  if (!Number.isFinite(amount)) return { error: 'Enter a valid amount, e.g. 450 or 1250.50.' };
  if (amount <= 0) return { error: 'Amount must be greater than 0.' };
  if (amount > LIMITS.amountMax) return { error: 'Amount is too large.' };
  if (typeof raw === 'string' && /\.\d{3,}$/.test(raw.trim())) {
    return { error: 'Use at most 2 decimal places.' };
  }
  const rounded = Math.round(amount * 100) / 100;
  if (rounded <= 0) return { error: 'Amount must be at least 0.01.' };
  return { value: rounded };
}

function result(errors, value) {
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/**
 * Validates a transaction. With `categoriesById` (a Map) the category must exist and
 * match the type, and categoryName is taken from it. Without it (backup import),
 * the provided categoryName is sanitised and used.
 */
export function validateTransactionInput(input, { categoriesById } = {}) {
  const errors = {};
  const source = input ?? {};

  const type = TRANSACTION_TYPES.includes(source.type) ? source.type : null;
  if (!type) errors.type = 'Choose expense or income.';

  const amount = validateAmount(source.amount);
  if (amount.error) errors.amount = amount.error;

  const categoryId = typeof source.categoryId === 'string' ? source.categoryId.trim() : '';
  let categoryName = '';
  if (!categoryId) {
    errors.categoryId = 'Choose a category.';
  } else if (!isValidDocId(categoryId)) {
    errors.categoryId = 'Choose a valid category.';
  } else if (categoriesById) {
    const category = categoriesById.get(categoryId);
    if (!category) errors.categoryId = 'Choose a valid category.';
    else if (type && category.type !== type) errors.categoryId = `Choose an ${type} category.`;
    else categoryName = category.name;
  } else {
    categoryName = cleanText(source.categoryName).slice(0, LIMITS.categoryNameMax);
    if (!categoryName) errors.categoryId = 'Category name is missing.';
  }

  const paymentMethod = PAYMENT_METHOD_VALUES.includes(source.paymentMethod) ? source.paymentMethod : null;
  if (!paymentMethod) errors.paymentMethod = 'Choose a payment method.';

  const date = typeof source.date === 'string' ? source.date : '';
  if (!date) errors.date = 'Choose a date.';
  else if (!isValidDateKey(date)) errors.date = 'Enter a valid date.';

  const description = cleanText(source.description ?? '');
  if (description.length > LIMITS.descriptionMax) {
    errors.description = `Keep the description under ${LIMITS.descriptionMax} characters.`;
  }

  return result(errors, {
    type,
    amount: amount.value,
    categoryId,
    categoryName,
    paymentMethod,
    date,
    description,
  });
}

/** `categories` is the user's current category list (for duplicate-name checks). */
export function validateCategoryInput(input, { categories = [], editingId = null } = {}) {
  const errors = {};
  const source = input ?? {};

  const name = cleanText(source.name);
  if (!name) errors.name = 'Enter a category name.';
  else if (name.length > LIMITS.categoryNameMax) {
    errors.name = `Keep the name under ${LIMITS.categoryNameMax} characters.`;
  }

  const type = TRANSACTION_TYPES.includes(source.type) ? source.type : null;
  if (!type) errors.type = 'Choose expense or income.';

  if (name && type) {
    const lower = name.toLocaleLowerCase();
    const duplicate = categories.some(
      (category) =>
        category.id !== editingId && category.type === type && category.name.toLocaleLowerCase() === lower,
    );
    if (duplicate) errors.name = `You already have an ${type} category called "${name}".`;
  }

  const icon = isCategoryIconKey(source.icon) ? source.icon : null;
  if (!icon) errors.icon = 'Choose an icon.';

  return result(errors, { name, type, icon });
}

export function validateBudgetInput(input, { categoriesById } = {}) {
  const errors = {};
  const source = input ?? {};

  const scope = source.scope === 'overall' || source.scope === 'category' ? source.scope : null;
  if (!scope) errors.scope = 'Invalid budget type.';

  const amount = validateAmount(source.amount);
  if (amount.error) errors.amount = amount.error;

  let name = 'Monthly budget';
  let categoryIds = [];

  if (scope === 'category') {
    name = cleanText(source.name);
    if (!name) errors.name = 'Enter a budget name.';
    else if (name.length > LIMITS.budgetNameMax) {
      errors.name = `Keep the name under ${LIMITS.budgetNameMax} characters.`;
    }

    const ids = Array.isArray(source.categoryIds) ? source.categoryIds : [];
    categoryIds = [...new Set(ids.filter(isValidDocId))];
    if (categoriesById) {
      categoryIds = categoryIds.filter((id) => categoriesById.get(id)?.type === 'expense');
    }
    if (categoryIds.length === 0) errors.categoryIds = 'Choose at least one expense category.';
    else if (categoryIds.length > LIMITS.budgetCategoriesMax) {
      errors.categoryIds = `Choose at most ${LIMITS.budgetCategoriesMax} categories.`;
    }
  }

  return result(errors, { scope, name, categoryIds, amount: amount.value });
}

export function validatePersonName(raw) {
  const name = cleanText(raw);
  if (!name) return { error: 'Enter a name.' };
  if (name.length > LIMITS.personNameMax) return { error: `Keep the name under ${LIMITS.personNameMax} characters.` };
  return { value: name };
}

/** Name already used by another person (case-insensitive)? */
export function findPersonByName(people, name, exceptId = null) {
  const lower = name.toLocaleLowerCase();
  return people.find((person) => person.id !== exceptId && person.name.toLocaleLowerCase() === lower) ?? null;
}

/**
 * Lend & Borrow entry. `personId` is optional for new entries (a new person is then
 * created from `personName`); when present it must be a valid document id.
 */
export function validateLedgerEntryInput(input) {
  const errors = {};
  const source = input ?? {};

  const person = validatePersonName(source.personName);
  if (person.error) errors.personName = person.error;

  const personId = typeof source.personId === 'string' && source.personId ? source.personId : null;
  if (personId && !isValidDocId(personId)) errors.personName = 'Choose a valid person.';

  const direction = LEDGER_DIRECTIONS.includes(source.direction) ? source.direction : null;
  if (!direction) errors.direction = 'Choose whether you gave or got money.';

  const amount = validateAmount(source.amount);
  if (amount.error) errors.amount = amount.error;

  const date = typeof source.date === 'string' ? source.date : '';
  if (!date) errors.date = 'Choose a date.';
  else if (!isValidDateKey(date)) errors.date = 'Enter a valid date.';

  const note = cleanText(source.note ?? '');
  if (note.length > LIMITS.ledgerNoteMax) errors.note = `Keep the note under ${LIMITS.ledgerNoteMax} characters.`;

  return result(errors, {
    personId,
    personName: person.value,
    direction,
    amount: amount.value,
    date,
    note,
  });
}

export function validateSettingsPatch(patch) {
  const value = {};
  const errors = {};
  if ('currency' in patch) {
    if (CURRENCY_CODES.includes(patch.currency)) value.currency = patch.currency;
    else errors.currency = 'Unsupported currency.';
  }
  if ('theme' in patch) {
    if (THEME_PREFERENCES.includes(patch.theme)) value.theme = patch.theme;
    else errors.theme = 'Unsupported theme.';
  }
  return result(errors, value);
}

export function validateDisplayName(raw) {
  const name = cleanText(raw);
  if (!name) return { error: 'Enter your name.' };
  if (name.length > LIMITS.displayNameMax) return { error: `Keep your name under ${LIMITS.displayNameMax} characters.` };
  return { value: name };
}

export function validateEmail(raw) {
  const email = typeof raw === 'string' ? raw.trim() : '';
  if (!email) return { error: 'Enter your email address.' };
  if (!EMAIL_PATTERN.test(email) || email.length > 320) return { error: 'Enter a valid email address.' };
  return { value: email };
}

export function validateNewPassword(password) {
  if (!password) return { error: 'Choose a password.' };
  if (password.length < 8) return { error: 'Use at least 8 characters.' };
  if (password.length > 128) return { error: 'Use at most 128 characters.' };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { error: 'Include at least one letter and one number.' };
  return { value: password };
}
