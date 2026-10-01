import { useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { SkeletonList } from '@/components/common/Skeleton';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { deleteCategory } from '@/services/categoryService';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { CategoryFormModal } from './CategoryFormModal';

const TABS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export function CategoryManager() {
  const { expenseCategories, incomeCategories, status, error } = useCategories();
  const { categoryBudgets } = useBudgets();
  const toast = useToast();
  const [tab, setTab] = useState('expense');
  const [editor, setEditor] = useState({ open: false, category: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = tab === 'income' ? incomeCategories : expenseCategories;
  const usedInBudgets = pendingDelete
    ? categoryBudgets.filter((budget) => budget.categoryIds.includes(pendingDelete.id)).map((budget) => budget.name)
    : [];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      assertOnline();
      await deleteCategory(pendingDelete.id);
      toast.success('Category deleted.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete the category. Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card id="categories" className="scroll-mt-20 p-4 sm:p-6">
      <CardHeader
        title="Categories"
        description="Organise transactions your way. Default categories can be renamed or removed too."
        action={
          <Button size="sm" leftIcon={Plus} onClick={() => setEditor({ open: true, category: null })}>
            Add category
          </Button>
        }
      />

      <SegmentedControl label="Category type" hideLabel value={tab} onChange={setTab} options={TABS} className="mt-5 max-w-xs" />

      <div className="mt-4">
        {status === 'error' ? (
          <ErrorState error={error} />
        ) : status === 'loading' ? (
          <SkeletonList rows={4} label="Loading categories…" />
        ) : list.length === 0 ? (
          <EmptyState compact icon={Tags} title={`No ${tab} categories`} description="Add a category to start using it in transactions." />
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {list.map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <CategoryBadge icon={category.icon} type={category.type} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{category.name}</span>
                {category.isDefault && (
                  <span className="hidden rounded-md bg-subtle px-2 py-0.5 text-xs text-ink-3 sm:inline">Default</span>
                )}
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditor({ open: true, category })}
                    aria-label={`Edit category ${category.name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={() => setPendingDelete(category)}
                    aria-label={`Delete category ${category.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CategoryFormModal
        open={editor.open}
        category={editor.category}
        defaultType={tab}
        onClose={() => setEditor({ open: false, category: null })}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete category?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed. Existing transactions keep this category name, but you won't be able to pick it for new ones.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {usedInBudgets.length > 0 && (
          <p className="mt-3 rounded-xl bg-caution-soft px-3.5 py-2.5 text-sm text-caution">
            Used by the budget{usedInBudgets.length === 1 ? '' : 's'}: {usedInBudgets.join(', ')}. Past spending in this
            category still counts towards {usedInBudgets.length === 1 ? 'it' : 'them'}.
          </p>
        )}
      </ConfirmDialog>
    </Card>
  );
}
