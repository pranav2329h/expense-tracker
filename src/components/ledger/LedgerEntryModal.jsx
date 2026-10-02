import { useId, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useLedger } from '@/hooks/useLedger';
import { useToast } from '@/hooks/useToast';
import { createLedgerEntry, updateLedgerEntry } from '@/services/ledgerService';
import { LIMITS } from '@/utils/constants';
import { todayKey } from '@/utils/dates';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { findPersonByName, validateLedgerEntryInput } from '@/utils/validation';

const FORM_ID = 'ledger-entry-form';

const DIRECTION_OPTIONS = [
  { value: 'gave', label: 'You gave', icon: ArrowUpRight },
  { value: 'got', label: 'You got', icon: ArrowDownLeft },
];

const DIRECTION_HINTS = {
  gave: 'You lent them money, paid for something of theirs, or paid them back.',
  got: 'They lent you money, paid for something of yours (like a bill), or paid you back.',
};

const NOTE_PLACEHOLDERS = {
  gave: 'e.g. Lent for rent',
  got: 'e.g. Paid my electricity bill',
};

function LedgerEntryForm({ entry, person, defaults, onSaved, onSavingChange }) {
  const { people } = useLedger();
  const { byId, expenseCategories } = useCategories();
  const { symbol } = useCurrency();
  const toast = useToast();
  const listId = useId();

  const fixedPerson = person ?? (entry ? { id: entry.personId, name: entry.personName } : null);
  const [values, setValues] = useState(() => ({
    personName: fixedPerson?.name ?? '',
    direction: entry?.direction ?? defaults?.direction ?? 'gave',
    amount: entry ? String(entry.amount) : '',
    date: entry?.date ?? todayKey(),
    note: entry?.note ?? '',
  }));
  const [expense, setExpense] = useState({ enabled: false, categoryId: '' });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const matchedPerson = !fixedPerson && values.personName.trim() ? findPersonByName(people, values.personName.trim()) : null;
  const canAddExpense = !entry && values.direction === 'got';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const input = { ...values, personId: fixedPerson?.id ?? null };
    const result = validateLedgerEntryInput(input);
    const nextErrors = { ...result.errors };
    if (canAddExpense && expense.enabled && !expense.categoryId) nextErrors.categoryId = 'Choose an expense category.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSavingChange(true);
    try {
      assertOnline();
      if (entry) {
        await updateLedgerEntry(entry, input);
        toast.success('Entry updated.');
      } else {
        const withExpense = canAddExpense && expense.enabled;
        await createLedgerEntry(input, {
          people,
          expense: withExpense ? { categoryId: expense.categoryId } : null,
          categoriesById: byId,
        });
        toast.success(withExpense ? 'Entry saved and added to your expenses.' : 'Entry saved.');
      }
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the entry. Please try again.'));
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-5">
      {fixedPerson ? (
        <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-ink-2">
          With <span className="font-semibold text-ink">{fixedPerson.name}</span>
        </p>
      ) : (
        <div>
          <Input
            label="Person"
            placeholder="Name, e.g. Rahul"
            autoComplete="off"
            list={listId}
            maxLength={LIMITS.personNameMax}
            value={values.personName}
            onChange={(event) => update('personName', event.target.value)}
            error={errors.personName}
            hint={
              values.personName.trim()
                ? matchedPerson
                  ? `Adds to ${matchedPerson.name}'s existing balance.`
                  : 'New person — they will be added to your list.'
                : 'Pick someone you already track, or type a new name.'
            }
            data-autofocus
          />
          <datalist id={listId}>
            {people.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
        </div>
      )}

      <div>
        <SegmentedControl
          label="What happened?"
          value={values.direction}
          onChange={(direction) => update('direction', direction)}
          options={DIRECTION_OPTIONS}
        />
        <p className="mt-2 text-xs text-ink-3">{DIRECTION_HINTS[values.direction]}</p>
      </div>

      <Input
        label="Amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        prefix={symbol}
        value={values.amount}
        onChange={(event) => update('amount', event.target.value)}
        error={errors.amount}
        inputClassName="h-12 text-lg font-semibold tabular"
        data-autofocus={fixedPerson ? true : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker label="Date" value={values.date} onChange={(date) => update('date', date)} error={errors.date} />
        <Input
          label="Note"
          optional
          placeholder={NOTE_PLACEHOLDERS[values.direction]}
          maxLength={LIMITS.ledgerNoteMax}
          value={values.note}
          onChange={(event) => update('note', event.target.value)}
          error={errors.note}
        />
      </div>

      {canAddExpense && (
        <div className="rounded-xl border border-line p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={expense.enabled}
              onChange={(event) => {
                setExpense((current) => ({ ...current, enabled: event.target.checked }));
                setErrors((current) => ({ ...current, categoryId: undefined }));
              }}
              className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Also add to my expenses</span>
              <span className="mt-0.5 block text-xs text-ink-3">
                Use this when they paid for something of yours, like a bill. It's recorded as a separate expense
                that you can edit on the Transactions page.
              </span>
            </span>
          </label>
          {expense.enabled && (
            <Select
              label="Expense category"
              className="mt-4"
              placeholder="Choose a category"
              value={expense.categoryId}
              options={expenseCategories.map((category) => ({ value: category.id, label: category.name }))}
              onChange={(event) => {
                setExpense((current) => ({ ...current, categoryId: event.target.value }));
                setErrors((current) => ({ ...current, categoryId: undefined }));
              }}
              error={errors.categoryId}
            />
          )}
        </div>
      )}
    </form>
  );
}

/**
 * Add or edit a Lend & Borrow entry. `person` fixes the person (from their page);
 * `defaults.direction` preselects "You gave" / "You got".
 */
export function LedgerEntryModal({ open, entry, person, defaults, onClose, onRequestDelete }) {
  const [saving, setSaving] = useState(false);
  const close = () => {
    if (!saving) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={entry ? 'Edit entry' : 'New entry'}
      fullScreenOnMobile
      footer={
        <>
          {entry && onRequestDelete && (
            <Button
              variant="danger-ghost"
              leftIcon={Trash2}
              onClick={() => onRequestDelete(entry)}
              disabled={saving}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {entry ? 'Save changes' : 'Save entry'}
          </Button>
        </>
      }
    >
      <LedgerEntryForm
        entry={entry}
        person={person}
        defaults={defaults}
        onSaved={onClose}
        onSavingChange={setSaving}
      />
    </Modal>
  );
}
