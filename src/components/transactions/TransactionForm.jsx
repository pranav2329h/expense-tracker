import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { DatePicker } from '@/components/common/DatePicker';
import { Input } from '@/components/common/Input';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { LIMITS, PAYMENT_METHODS } from '@/utils/constants';
import { todayKey, yesterdayKey } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { readLastPaymentMethod } from '@/utils/preferences';
import { validateTransactionInput } from '@/utils/validation';
import { CategoryPicker } from './CategoryPicker';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
];

const FIELD_ORDER = ['amount', 'categoryId', 'paymentMethod', 'date', 'description'];

function toFormValues(transaction, defaults, currency) {
  if (transaction) {
    return {
      type: transaction.type,
      amount: String(transaction.amount),
      categoryId: transaction.categoryId,
      paymentMethod: transaction.paymentMethod,
      date: transaction.date,
      description: transaction.description,
    };
  }
  return {
    type: defaults?.type ?? 'expense',
    amount: '',
    categoryId: defaults?.categoryId ?? '',
    paymentMethod:
      defaults?.paymentMethod ?? readLastPaymentMethod() ?? (currency === 'INR' ? 'upi' : 'debit_card'),
    date: defaults?.date ?? todayKey(),
    description: '',
  };
}

/**
 * Add/edit form. Submit buttons live in the modal footer and target this form via
 * its id. Validation runs on submit and inline errors clear as fields are fixed.
 */
export function TransactionForm({ id, transaction, defaults, onSubmit, autoFocus = false }) {
  const { byId, expenseCategories, incomeCategories } = useCategories();
  const { symbol, currency } = useCurrency();
  const [values, setValues] = useState(() => toFormValues(transaction, defaults, currency));
  const [errors, setErrors] = useState({});

  const categories = values.type === 'income' ? incomeCategories : expenseCategories;

  const update = (field, value) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      // Switching type clears a category that belongs to the other type.
      if (field === 'type' && byId.get(current.categoryId)?.type !== value) next.categoryId = '';
      return next;
    });
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = validateTransactionInput(values, { categoriesById: byId });
    if (!result.ok) {
      setErrors(result.errors);
      const firstField = FIELD_ORDER.find((field) => result.errors[field]);
      const element = firstField ? event.currentTarget.elements.namedItem(firstField) : null;
      (element instanceof RadioNodeList ? element[0] : element)?.focus();
      return;
    }
    onSubmit(result.value);
  };

  return (
    <form id={id} noValidate onSubmit={handleSubmit} className="space-y-5">
      <SegmentedControl
        label="Transaction type"
        hideLabel
        value={values.type}
        onChange={(type) => update('type', type)}
        options={TYPE_OPTIONS}
      />

      <Input
        label="Amount"
        name="amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        prefix={symbol}
        value={values.amount}
        onChange={(event) => update('amount', event.target.value)}
        error={errors.amount}
        data-autofocus={autoFocus || undefined}
        inputClassName="h-12 text-lg font-semibold tabular"
      />

      {categories.length > 0 ? (
        <CategoryPicker
          name="categoryId"
          categories={categories}
          value={values.categoryId}
          onChange={(id) => update('categoryId', id)}
          error={errors.categoryId}
          type={values.type}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-2">
          You don't have any {values.type} categories yet.{' '}
          <Link to="/settings#categories" className="font-medium text-brand-text underline-offset-2 hover:underline">
            Add one in Settings
          </Link>
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Payment method"
          name="paymentMethod"
          value={values.paymentMethod}
          onChange={(event) => update('paymentMethod', event.target.value)}
          options={PAYMENT_METHODS}
          error={errors.paymentMethod}
        />
        <div>
          <DatePicker
            label="Date"
            name="date"
            value={values.date}
            onChange={(date) => update('date', date)}
            error={errors.date}
          />
          <div className="mt-2 flex gap-1.5">
            {[
              { label: 'Today', value: todayKey() },
              { label: 'Yesterday', value: yesterdayKey() },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => update('date', option.value)}
                aria-pressed={values.date === option.value}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  values.date === option.value ? 'bg-brand-soft text-brand-text' : 'text-ink-3 hover:bg-subtle hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Input
        label="Description"
        name="description"
        optional
        placeholder={values.type === 'income' ? 'e.g. October salary' : 'e.g. Dinner with friends'}
        value={values.description}
        maxLength={LIMITS.descriptionMax}
        onChange={(event) => update('description', event.target.value)}
        error={errors.description}
        hint={`${values.description.length}/${LIMITS.descriptionMax}`}
      />
    </form>
  );
}
