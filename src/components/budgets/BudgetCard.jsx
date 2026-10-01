import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CategoryChip } from '@/components/common/CategoryBadge';
import { useCategories } from '@/hooks/useCategories';
import { BudgetProgress } from './BudgetProgress';

export function BudgetCard({ progress, onEdit, onDelete }) {
  const { byId } = useCategories();
  const categories = progress.categoryIds.map(
    (id) => byId.get(id) ?? { id, name: 'Deleted category', icon: 'tag' },
  );

  return (
    <Card as="article" className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">{progress.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <CategoryChip key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex-1">
        <BudgetProgress progress={progress} label={`${progress.name} budget used`} />
      </div>
      <div className="mt-4 flex gap-1 border-t border-line pt-3">
        <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => onEdit(progress)} aria-label={`Edit ${progress.name} budget`}>
          Edit
        </Button>
        <Button
          variant="danger-ghost"
          size="sm"
          leftIcon={Trash2}
          onClick={() => onDelete(progress)}
          aria-label={`Delete ${progress.name} budget`}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
