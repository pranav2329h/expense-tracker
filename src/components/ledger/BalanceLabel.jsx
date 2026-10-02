import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import { getBalanceStatus } from '@/utils/ledger';

const CAPTIONS = { get: 'Owes you', give: 'You owe' };

/**
 * A person's balance: green when they owe you, red when you owe them. The caption
 * ("Owes you" / "You owe" / "Settled up") carries the meaning without relying on colour.
 */
export function BalanceLabel({ balance, className }) {
  const { format } = useCurrency();
  const status = getBalanceStatus(balance);

  if (status === 'settled') {
    return <span className={cn('text-sm font-medium text-ink-3', className)}>Settled up</span>;
  }

  return (
    <span className={cn('flex flex-col items-end', className)}>
      <span className={cn('text-sm font-semibold tabular', status === 'get' ? 'text-positive' : 'text-negative')}>
        {format(Math.abs(balance))}
      </span>
      <span className="text-xs text-ink-3">{CAPTIONS[status]}</span>
    </span>
  );
}
