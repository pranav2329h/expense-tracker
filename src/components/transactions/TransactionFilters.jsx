import { useId, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useCategories } from '@/hooks/useCategories';
import { PAYMENT_METHODS } from '@/utils/constants';
import { DATE_PRESETS } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { SORT_OPTIONS } from '@/utils/transactions';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
];

const METHOD_OPTIONS = [{ value: '', label: 'All methods' }, ...PAYMENT_METHODS];

/**
 * Search + filter bar. On phones the filters collapse behind a "Filters" button so
 * the list stays visible; from `md` up they sit in one row above the results.
 */
export function TransactionFilters({ filters, onChange, onReset, activeCount }) {
  const { categories, expenseCategories, incomeCategories } = useCategories();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const visibleCategories =
    filters.type === 'income' ? incomeCategories : filters.type === 'expense' ? expenseCategories : categories;
  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...visibleCategories.map((category) => ({
      value: category.id,
      label: filters.type ? category.name : `${category.name} · ${category.type === 'income' ? 'Income' : 'Expense'}`,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          label="Search transactions"
          hideLabel
          type="search"
          placeholder="Search description, category or method…"
          prefix={<Search className="size-4" />}
          value={filters.q}
          onChange={(event) => onChange({ q: event.target.value })}
          className="min-w-0 flex-1"
          autoComplete="off"
        />
        <Button
          variant="secondary"
          className="md:hidden"
          leftIcon={SlidersHorizontal}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </div>

      <div
        id={panelId}
        className={cn('gap-2 sm:grid-cols-2 md:grid md:grid-cols-3 xl:grid-cols-5', expanded ? 'grid' : 'hidden')}
      >
        <Select
          label="Type"
          hideLabel
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(event) => onChange({ type: event.target.value, category: '' })}
        />
        <Select
          label="Category"
          hideLabel
          value={filters.category}
          options={categoryOptions}
          onChange={(event) => onChange({ category: event.target.value })}
        />
        <Select
          label="Payment method"
          hideLabel
          value={filters.method}
          options={METHOD_OPTIONS}
          onChange={(event) => onChange({ method: event.target.value })}
        />
        <Select
          label="Date range"
          hideLabel
          value={filters.range}
          options={DATE_PRESETS}
          onChange={(event) => onChange({ range: event.target.value })}
        />
        <Select
          label="Sort by"
          hideLabel
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(event) => onChange({ sort: event.target.value })}
        />
      </div>

      {filters.range === 'custom' && (
        <div className={cn('grid-cols-2 gap-2 sm:max-w-md md:grid', expanded ? 'grid' : 'hidden')}>
          <DatePicker label="From" value={filters.from} onChange={(from) => onChange({ from })} max={filters.to || undefined} />
          <DatePicker label="To" value={filters.to} onChange={(to) => onChange({ to })} min={filters.from || undefined} />
        </div>
      )}

      {activeCount > 0 && (
        <div className={cn('md:block', expanded ? 'block' : 'hidden')}>
          <Button variant="ghost" size="sm" leftIcon={X} onClick={onReset}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
