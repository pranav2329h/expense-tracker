import { Link } from 'react-router';
import { ArrowRight, HandCoins } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { useCurrency } from '@/hooks/useCurrency';
import { useLedger } from '@/hooks/useLedger';

const people = (count) => `${count} ${count === 1 ? 'person' : 'people'}`;

/** Lend & Borrow at a glance; hidden when nothing is outstanding. */
export function LedgerSummaryCard() {
  const { totals, status } = useLedger();
  const { format } = useCurrency();
  if (status !== 'ready' || totals.openCount === 0) return null;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex items-center gap-3 sm:w-48">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-ink-2">
          <HandCoins className="size-[18px]" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">Lend & Borrow</h2>
      </div>
      <dl className="grid flex-1 grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-ink-3">You will get</dt>
          <dd className="text-lg font-semibold text-positive">{format(totals.toGet)}</dd>
          <dd className="text-xs text-ink-3">{totals.getCount ? `from ${people(totals.getCount)}` : 'Nobody owes you'}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">You will give</dt>
          <dd className="text-lg font-semibold text-negative">{format(totals.toGive)}</dd>
          <dd className="text-xs text-ink-3">{totals.giveCount ? `to ${people(totals.giveCount)}` : "You don't owe anyone"}</dd>
        </div>
      </dl>
      <Link
        to="/lend-borrow"
        className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-lg px-3 text-sm font-medium text-brand-text hover:bg-brand-soft sm:self-center"
      >
        View all
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}
