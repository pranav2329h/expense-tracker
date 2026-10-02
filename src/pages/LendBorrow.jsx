import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, HandCoins, Info, Plus, Scale, Search, SearchX } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { PageHeader } from '@/components/common/PageHeader';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SkeletonList } from '@/components/common/Skeleton';
import { StatCard } from '@/components/common/StatCard';
import { BalanceLabel } from '@/components/ledger/BalanceLabel';
import { LedgerEntryModal } from '@/components/ledger/LedgerEntryModal';
import { useCurrency } from '@/hooks/useCurrency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLedger } from '@/hooks/useLedger';
import { formatDate } from '@/utils/dates';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'get', label: 'They owe you' },
  { value: 'give', label: 'You owe' },
  { value: 'settled', label: 'Settled' },
];

const people = (count) => `${count} ${count === 1 ? 'person' : 'people'}`;

export default function LendBorrow() {
  useDocumentTitle('Lend & Borrow');
  const { balances, totals, status, error } = useLedger();
  const { format } = useCurrency();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState({ open: false, key: 0 });

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return balances.filter(
      (person) =>
        (filter === 'all' || person.status === filter) && (!term || person.name.toLocaleLowerCase().includes(term)),
    );
  }, [balances, query, filter]);

  const openAdd = () => setModal((current) => ({ open: true, key: current.key + 1 }));

  let list;
  if (status === 'error') {
    list = <ErrorState title="We couldn't load Lend & Borrow" error={error} onRetry={() => window.location.reload()} />;
  } else if (status === 'loading') {
    list = (
      <div className="px-4 sm:px-5">
        <SkeletonList rows={5} label="Loading people…" />
      </div>
    );
  } else if (balances.length === 0) {
    list = (
      <EmptyState
        icon={HandCoins}
        title="No one here yet"
        description="Add money you lend or borrow — or a bill someone pays for you — and always know who owes whom."
        action={
          <Button leftIcon={Plus} onClick={openAdd}>
            Add payment
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    list = (
      <EmptyState
        compact
        icon={SearchX}
        title="No matching people"
        description="Try a different name or filter."
      />
    );
  } else {
    list = (
      <ul className="divide-y divide-line">
        {visible.map((person) => (
          <li key={person.id}>
            <Link
              to={`/lend-borrow/${person.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle focus-visible:-outline-offset-2 sm:px-5"
            >
              <Avatar name={person.name} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{person.name}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-3">
                  {person.count} {person.count === 1 ? 'payment' : 'payments'}
                  {person.lastDate ? ` · Last ${formatDate(person.lastDate, 'dd MMM yyyy')}` : ''}
                </span>
              </span>
              <BalanceLabel balance={person.balance} />
              <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <PageHeader
        title="Lend & Borrow"
        description="Money you lend, borrow, or that someone pays for you — and who still owes whom."
        actions={
          <Button leftIcon={Plus} onClick={openAdd}>
            Add payment
          </Button>
        }
      />

      <div className="space-y-4 sm:space-y-6">
        <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            label="They owe you"
            icon={ArrowDownLeft}
            value={format(totals.toGet)}
            loading={status === 'loading'}
            caption={totals.getCount ? `From ${people(totals.getCount)}` : 'Nobody owes you'}
          />
          <StatCard
            label="You owe"
            icon={ArrowUpRight}
            value={format(totals.toGive)}
            loading={status === 'loading'}
            caption={totals.giveCount ? `To ${people(totals.giveCount)}` : "You don't owe anyone"}
          />
          <StatCard
            className="col-span-2 lg:col-span-1"
            label="Overall"
            icon={Scale}
            value={format(Math.abs(totals.net))}
            loading={status === 'loading'}
            caption={
              totals.net > 0
                ? 'Overall, people owe you this much'
                : totals.net < 0
                  ? 'Overall, you owe this much'
                  : 'All settled up'
            }
          />
        </section>

        <p className="flex items-start gap-2 text-xs text-ink-3">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Lending and borrowing isn't income or spending, so it doesn't change your balance. If someone pays a bill for
          you, tick “Also add to my expenses” when you add it.
        </p>

        {balances.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              label="Search people"
              hideLabel
              type="search"
              placeholder="Search people…"
              prefix={<Search className="size-4" />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1"
              autoComplete="off"
            />
            <SegmentedControl
              label="Show"
              hideLabel
              size="sm"
              value={filter}
              onChange={setFilter}
              options={FILTERS}
              className="sm:w-96"
            />
          </div>
        )}

        <Card className="overflow-clip">{list}</Card>
      </div>

      <LedgerEntryModal
        key={modal.key}
        open={modal.open}
        onClose={() => setModal((current) => ({ ...current, open: false }))}
      />
    </>
  );
}
