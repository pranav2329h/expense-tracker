import { createElement, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/useToast';
import { createBudget, updateBudget } from '@/services/budgetService';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { LIMITS } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { validateBudgetInput } from '@/utils/validation';

const FORM_ID = 'budget-form';

function suggestName(categoryIds, byId) {
  const names = categoryIds.map((id) => byId.get(id)?.name).filter(Boolean);
  if (names.length <= 2) return names.join(' & ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

function BudgetForm({ budget, scope, onSaved, onSavingChange }) {
  const { byId, expenseCategories } = useCategories();
  const { symbol } = useCurrency();
  const toast = useToast();
  const [values, setValues] = useState(() => ({
    name: budget?.scope === 'category' ? budget.name : '',
    categoryIds: budget?.categoryIds ?? [],
    amount: budget ? String(budget.amount) : '',
  }));
  const [nameEdited, setNameEdited] = useState(Boolean(budget));
  const [errors, setErrors] = useState({});

  const toggleCategory = (id) => {
    setValues((current) => {
      const categoryIds = current.categoryIds.includes(id)
        ? current.categoryIds.filter((value) => value !== id)
        : [...current.categoryIds, id];
      return { ...current, categoryIds, name: nameEdited ? current.name : suggestName(categoryIds, byId) };
    });
    setErrors((current) => ({ ...current, categoryIds: undefined, name: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const input = { ...values, scope };
    const result = validateBudgetInput(input, { categoriesById: byId });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSavingChange(true);
    try {
      assertOnline();
      if (budget) {
        await updateBudget(budget, input, byId);
        toast.success('Budget updated.');
      } else {
        await createBudget(input, byId);
        toast.success('Budget created.');
      }
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the budget. Please try again.'));
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-5">
      {scope === 'category' && (
        <fieldset aria-describedby={errors.categoryIds ? 'budget-categories-error' : undefined}>
          <legend className="mb-1.5 text-sm font-medium text-ink">Categories</legend>
          <p className="mb-2.5 text-xs text-ink-3">
            Pick one category, or several to budget them together (e.g. Rent, Electricity and Internet as “Bills”).
          </p>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-ink-2">
              No expense categories yet.{' '}
              <Link to="/settings#categories" className="font-medium text-brand-text hover:underline">
                Add one in Settings
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => {
                const checked = values.categoryIds.includes(category.id);
                return (
                  <label key={category.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors select-none',
                        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
                        checked
                          ? 'border-brand bg-brand-soft font-medium text-brand-text'
                          : 'border-line text-ink-2 hover:bg-subtle',
                      )}
                    >
                      {createElement(getCategoryIcon(category.icon), { className: 'size-4', 'aria-hidden': true })}
                      {category.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {errors.categoryIds && (
            <p id="budget-categories-error" className="mt-1.5 text-xs font-medium text-negative">
              {errors.categoryIds}
            </p>
          )}
        </fieldset>
      )}

      {scope === 'category' && (
        <Input
          label="Budget name"
          value={values.name}
          maxLength={LIMITS.budgetNameMax}
          placeholder="e.g. Food or Bills"
          onChange={(event) => {
            setNameEdited(true);
            setValues((current) => ({ ...current, name: event.target.value }));
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
        />
      )}

      <Input
        label="Monthly limit"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        prefix={symbol}
        value={values.amount}
        onChange={(event) => {
          setValues((current) => ({ ...current, amount: event.target.value }));
          setErrors((current) => ({ ...current, amount: undefined }));
        }}
        error={errors.amount}
        hint="Applies to every month until you change it."
        data-autofocus={scope === 'overall' ? true : undefined}
        inputClassName="text-base font-semibold tabular"
      />
    </form>
  );
}

/** Create or edit a budget. `scope` is 'overall' (one per user) or 'category'. */
export function BudgetFormModal({ open, budget, scope, onClose }) {
  const [saving, setSaving] = useState(false);
  const close = () => {
    if (!saving) onClose();
  };
  const title =
    scope === 'overall'
      ? budget
        ? 'Edit monthly budget'
        : 'Set monthly budget'
      : budget
        ? 'Edit category budget'
        : 'New category budget';

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={scope === 'overall' ? 'A spending limit for all expenses each month.' : undefined}
      fullScreenOnMobile={scope === 'category'}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {budget ? 'Save changes' : 'Create budget'}
          </Button>
        </>
      }
    >
      {open && <BudgetForm budget={budget} scope={scope} onSaved={onClose} onSavingChange={setSaving} />}
    </Modal>
  );
}
