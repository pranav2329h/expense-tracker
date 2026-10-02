import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CircleCheck, Handshake, Pencil, Receipt, Trash2, UserX } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonCard, SkeletonList } from '@/components/common/Skeleton';
import { LedgerEntryModal } from '@/components/ledger/LedgerEntryModal';
import { PersonFormModal } from '@/components/ledger/PersonFormModal';
import { useCurrency } from '@/hooks/useCurrency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useLedger } from '@/hooks/useLedger';
import { useToast } from '@/hooks/useToast';
import { createLedgerEntry, deleteLedgerEntry, deletePerson } from '@/services/ledgerService';
import { formatDate, todayKey } from '@/utils/dates';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { cn } from '@/utils/cn';
import { getBalanceStatus, getSettlement, withRunningBalance } from '@/utils/ledger';

const DIRECTION_LABELS = { gave: 'You gave', got: 'You got' };

function BalanceAfter({ balance }) {
  const { format } = useCurrency();
  const status = getBalanceStatus(balance);
  if (status === 'settled') return <span className="text-ink-3">Settled</span>;
  return (
    <span className="text-ink-3">
      {status === 'get' ? 'Owes you ' : 'You owe '}
      <span className="tabular">{format(Math.abs(balance))}</span>
    </span>
  );
}

function EntryAmount({ entry }) {
  const { format } = useCurrency();
  return (
    <span className={cn('font-semibold tabular', entry.direction === 'gave' ? 'text-negative' : 'text-positive')}>
      {format(entry.amount)}
    </span>
  );
}

export default function PersonLedger() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { people, entries, balances, status, error } = useLedger();
  const { format } = useCurrency();
  const toast = useToast();
  const isDesktop = useIsDesktop();

  const summary = balances.find((item) => item.id === personId) ?? null;
  const person = people.find((item) => item.id === personId) ?? (summary ? { id: summary.id, name: summary.name } : null);
  useDocumentTitle(person ? person.name : 'Lend & Borrow');

  const personEntries = useMemo(
    () => withRunningBalance(entries.filter((entry) => entry.personId === personId)),
    [entries, personId],
  );

  const [editor, setEditor] = useState({ open: false, key: 0, entry: null, direction: 'gave' });
  const [renaming, setRenaming] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'settle' | 'delete-person' | { entry }
  const [busy, setBusy] = useState(false);

  if (status === 'loading') {
    return (
      <div className="space-y-4" aria-busy="true">
        <SkeletonCard lines={3} label="Loading…" />
        <Card className="p-5">
          <SkeletonList rows={4} label="Loading entries…" />
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <ErrorState title="We couldn't load this person" error={error} onRetry={() => window.location.reload()} />
      </Card>
    );
  }

  if (!person) {
    return (
      <Card>
        <EmptyState
          icon={UserX}
          title="Person not found"
          description="They may have been deleted."
          action={
            <Link
              to="/lend-borrow"
              className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-medium text-ink hover:bg-subtle"
            >
              Back to Lend & Borrow
            </Link>
          }
        />
      </Card>
    );
  }

  const balance = summary?.balance ?? 0;
  const balanceStatus = getBalanceStatus(balance);
  const settlement = getSettlement(balance);

  const openEditor = (direction, entry = null) =>
    setEditor((current) => ({ open: true, key: current.key + 1, entry, direction }));

  const run = async (task, successMessage, fallback) => {
    setBusy(true);
    try {
      assertOnline();
      await task();
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const settleUp = async () => {
    const ok = await run(
      () =>
        createLedgerEntry(
          {
            personId: person.id,
            personName: person.name,
            direction: settlement.direction,
            amount: settlement.amount,
            date: todayKey(),
            note: 'Settled up',
          },
          { people },
        ),
      `Settled up with ${person.name}.`,
      'Unable to settle up. Please try again.',
    );
    if (ok) setConfirm(null);
  };

  const removePerson = async () => {
    const ok = await run(
      () => deletePerson(person, entries),
      `${person.name} deleted.`,
      'Unable to delete. Please try again.',
    );
    if (ok) navigate('/lend-borrow', { replace: true });
  };

  const removeEntry = async () => {
    const ok = await run(() => deleteLedgerEntry(confirm.entry.id), 'Entry deleted.', 'Unable to delete the entry.');
    if (ok) {
      setConfirm(null);
      setEditor((current) => ({ ...current, open: false }));
    }
  };

  const headline =
    balanceStatus === 'get'
      ? `${person.name} owes you`
      : balanceStatus === 'give'
        ? `You owe ${person.name}`
        : 'All settled up';

  return (
    <>
      <Link
        to="/lend-borrow"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Lend & Borrow
      </Link>

      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar name={person.name} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{person.name}</h1>
                <p className="text-sm text-ink-3">
                  {personEntries.length} {personEntries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setRenaming(true)}>
                Rename
              </Button>
              <Button variant="danger-ghost" size="sm" leftIcon={Trash2} onClick={() => setConfirm('delete-person')}>
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink-2">{headline}</p>
            {balanceStatus === 'settled' ? (
              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-ink">
                <CircleCheck className="size-6 text-positive" aria-hidden="true" />
                {format(0)}
              </p>
            ) : (
              <p
                className={cn(
                  'mt-1 text-3xl font-semibold tracking-tight sm:text-4xl',
                  balanceStatus === 'get' ? 'text-positive' : 'text-negative',
                )}
              >
                {format(Math.abs(balance))}
              </p>
            )}
            {summary && (summary.gave > 0 || summary.got > 0) && (
              <p className="mt-1.5 text-xs text-ink-3">
                You gave {format(summary.gave)} · You got {format(summary.got)}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="secondary" leftIcon={ArrowUpRight} onClick={() => openEditor('gave')}>
                You gave
              </Button>
              <Button variant="secondary" leftIcon={ArrowDownLeft} onClick={() => openEditor('got')}>
                You got
              </Button>
            </div>
            {settlement && (
              <Button leftIcon={Handshake} onClick={() => setConfirm('settle')}>
                Settle up {format(settlement.amount)}
              </Button>
            )}
          </div>
        </Card>

        <Card className="overflow-clip">
          <CardHeader title="Entries" description="Newest first" className="px-4 pt-4 sm:px-6 sm:pt-5" />
          <div className="mt-3">
            {personEntries.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="No entries yet"
                description={`Record money you gave to or got from ${person.name}.`}
              />
            ) : isDesktop ? (
              <table className="w-full text-sm">
                <caption className="sr-only">Entries with {person.name}</caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs font-medium text-ink-3">
                    <th scope="col" className="py-2.5 pr-3 pl-6 font-medium">Date</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Details</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">You gave</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">You got</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Balance</th>
                    <th scope="col" className="py-2.5 pr-6 pl-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {personEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-line last:border-b-0 hover:bg-subtle/60">
                      <td className="py-3 pr-3 pl-6 whitespace-nowrap text-ink-2 tabular">{formatDate(entry.date)}</td>
                      <td className="max-w-xs truncate px-3 py-3 text-ink">{entry.note || '—'}</td>
                      <td className="px-3 py-3 text-right">{entry.direction === 'gave' && <EntryAmount entry={entry} />}</td>
                      <td className="px-3 py-3 text-right">{entry.direction === 'got' && <EntryAmount entry={entry} />}</td>
                      <td className="px-3 py-3 text-right text-xs whitespace-nowrap">
                        <BalanceAfter balance={entry.balanceAfter} />
                      </td>
                      <td className="py-2 pr-6 pl-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={Pencil}
                          onClick={() => openEditor(entry.direction, entry)}
                          aria-label={`Edit entry from ${formatDate(entry.date)}`}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {personEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => openEditor(entry.direction, entry)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle"
                    >
                      <span
                        className={cn(
                          'grid size-9 shrink-0 place-items-center rounded-xl',
                          entry.direction === 'gave' ? 'bg-negative-soft text-negative' : 'bg-positive-soft text-positive',
                        )}
                        aria-hidden="true"
                      >
                        {entry.direction === 'gave' ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {entry.note || DIRECTION_LABELS[entry.direction]}
                        </span>
                        <span className="mt-0.5 block truncate text-xs">
                          <span className="text-ink-3">{formatDate(entry.date)} · </span>
                          <BalanceAfter balance={entry.balanceAfter} />
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <EntryAmount entry={entry} />
                        <span className="text-xs text-ink-3">{DIRECTION_LABELS[entry.direction]}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <LedgerEntryModal
        key={editor.key}
        open={editor.open}
        entry={editor.entry}
        person={person}
        defaults={{ direction: editor.direction }}
        onClose={() => setEditor((current) => ({ ...current, open: false }))}
        onRequestDelete={(entry) => setConfirm({ entry })}
      />

      <PersonFormModal open={renaming} person={person} onClose={() => setRenaming(false)} />

      <ConfirmDialog
        open={confirm === 'settle'}
        tone="primary"
        title={`Settle up with ${person.name}?`}
        description={
          settlement
            ? settlement.direction === 'got'
              ? `This records ${format(settlement.amount)} you got from ${person.name} today, bringing the balance to zero.`
              : `This records ${format(settlement.amount)} you gave to ${person.name} today, bringing the balance to zero.`
            : ''
        }
        confirmLabel="Settle up"
        loading={busy}
        onConfirm={settleUp}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'delete-person'}
        title={`Delete ${person.name}?`}
        description={`This permanently deletes ${person.name} and all ${personEntries.length} of their entries. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={removePerson}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={Boolean(confirm?.entry)}
        title="Delete entry?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={removeEntry}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.entry && (
          <div className="mt-4 rounded-xl border border-line bg-subtle px-4 py-3 text-sm">
            <p className="font-medium text-ink">
              {DIRECTION_LABELS[confirm.entry.direction]} {format(confirm.entry.amount)}
            </p>
            <p className="mt-0.5 text-ink-3">
              {confirm.entry.note || 'No note'} · {formatDate(confirm.entry.date)}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
