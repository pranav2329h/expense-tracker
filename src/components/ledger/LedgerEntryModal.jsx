import { useId, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CircleCheck, Trash2 } from 'lucide-react';
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
import { roundMoney } from '@/utils/calculations';
import { LIMITS } from '@/utils/constants';
import { todayKey } from '@/utils/dates';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { getBalanceStatus } from '@/utils/ledger';
import { cn } from '@/utils/cn';
import { findPersonByName, validateAmount, validateLedgerEntryInput } from '@/utils/validation';

const FORM_ID = 'ledger-entry-form';

// Stored as 'gave' / 'got'; shown as who paid.
const WHO_PAID_OPTIONS = [
  { value: 'gave', label: 'I paid', icon: ArrowUpRight },
  { value: 'got', label: 'They paid', icon: ArrowDownLeft },
];

const WHO_PAID_HINTS = {
  gave: 'Use this when you lend them money, pay for something of theirs, or pay them back.',
  got: 'Use this when they lend you money, pay for something of yours (like your bill), or pay you back.',
};

const NOTE_PLACEHOLDERS = {
  gave: 'e.g. Lent for train tickets',
  got: 'e.g. Paid my electricity bill',
};

const effectOf = (direction, amount) => (direction === 'gave' ? amount : -amount);

/** "After saving: Rahul will owe you ₹2,500" — shows what the payment does to the balance. */
function BalancePreview({ name, balance }) {
  const { format } = useCurrency();
  const status = getBalanceStatus(balance);
  const who = name || null;
  const text =
    status === 'get'
      ? `${who ?? 'They'} will owe you ${format(balance)}`
      : status === 'give'
        ? `You will owe ${who ?? 'them'} ${format(Math.abs(balance))}`
        : `You${who ? ` and ${who}` : ''} will be all settled up`;

  return (
    <p
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium',
        status === 'get' && 'bg-positive-soft text-positive',
        status === 'give' && 'bg-negative-soft text-negative',
        status === 'settled' && 'bg-subtle text-ink-2',
      )}
    >
      {status === 'settled' && <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span>
        <span className="font-normal opacity-80">After saving: </span>
        {text}
      </span>
    </p>
  );
}

function LedgerEntryForm({ entry, person, defaults, onSaved, onSavingChange }) {
  const { people, balances } = useLedger();
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

  const typedName = values.personName.trim();
  const matchedPerson = !fixedPerson && typedName ? findPersonByName(people, typedName) : null;
  const previewPerson = fixedPerson ?? matchedPerson;
  const canAddExpense = !entry && values.direction === 'got';

  // Live preview of the balance after this payment is saved.
  const amount = validateAmount(values.amount).value;
  let previewBalance = null;
  if (amount) {
    const current = previewPerson ? (balances.find((item) => item.id === previewPerson.id)?.balance ?? 0) : 0;
    const previous = entry ? effectOf(entry.direction, entry.amount) : 0;
    previewBalance = roundMoney(current - previous + effectOf(values.direction, amount));
  }

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
        toast.success('Payment updated.');
      } else {
        const withExpense = canAddExpense && expense.enabled;
        await createLedgerEntry(input, {
          people,
          expense: withExpense ? { categoryId: expense.categoryId } : null,
          categoriesById: byId,
        });
        toast.success(withExpense ? 'Payment saved and added to your expenses.' : 'Payment saved.');
      }
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the payment. Please try again.'));
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-5">
      {fixedPerson ? (
        <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-ink-2">
          Between you and <span className="font-semibold text-ink">{fixedPerson.name}</span>
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
              typedName
                ? matchedPerson
                  ? `Adds to your balance with ${matchedPerson.name}.`
                  : 'New person — they will be added to your list.'
                : 'Pick someone from your list, or type a new name.'
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
          label="Who paid?"
          value={values.direction}
          onChange={(direction) => update('direction', direction)}
          options={WHO_PAID_OPTIONS}
        />
        <p className="mt-2 text-xs text-ink-3">{WHO_PAID_HINTS[values.direction]}</p>
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

      {previewBalance !== null && <BalancePreview name={previewPerson?.name ?? typedName} balance={previewBalance} />}

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
                Tick this if they paid for something of yours, like a bill or a meal, so your spending stays correct.
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
 * Add or edit a Lend & Borrow payment. `person` fixes the person (from their page);
 * `defaults.direction` preselects "I paid" ('gave') or "They paid" ('got').
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
      title={entry ? 'Edit payment' : 'Add payment'}
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
            {entry ? 'Save changes' : 'Save payment'}
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
