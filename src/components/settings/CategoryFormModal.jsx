import { createElement, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { createCategory, updateCategory } from '@/services/categoryService';
import { CATEGORY_ICON_KEYS, CATEGORY_ICONS } from '@/utils/categoryIcons';
import { LIMITS } from '@/utils/constants';
import { cn } from '@/utils/cn';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { validateCategoryInput } from '@/utils/validation';

const FORM_ID = 'category-form';
const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

function CategoryForm({ category, defaultType, onSaved, onSavingChange }) {
  const { categories } = useCategories();
  const toast = useToast();
  const [values, setValues] = useState(() => ({
    name: category?.name ?? '',
    type: category?.type ?? defaultType,
    icon: category?.icon ?? 'tag',
  }));
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validateCategoryInput(values, { categories, editingId: category?.id });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSavingChange(true);
    try {
      assertOnline();
      if (category) {
        await updateCategory(category, values, categories);
        toast.success('Category updated.');
      } else {
        await createCategory(values, categories);
        toast.success('Category created.');
      }
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the category. Please try again.'));
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-5">
      {category ? (
        <p className="text-sm text-ink-3">
          {category.type === 'income' ? 'Income' : 'Expense'} category · the type can't be changed after creation.
        </p>
      ) : (
        <SegmentedControl label="Type" value={values.type} onChange={(type) => update('type', type)} options={TYPE_OPTIONS} />
      )}
      <Input
        label="Name"
        value={values.name}
        maxLength={LIMITS.categoryNameMax}
        placeholder="e.g. Fuel"
        onChange={(event) => update('name', event.target.value)}
        error={errors.name}
        data-autofocus
      />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Icon</legend>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {CATEGORY_ICON_KEYS.map((key) => (
            <label key={key} className="relative">
              <input
                type="radio"
                name="category-icon"
                value={key}
                checked={values.icon === key}
                onChange={() => update('icon', key)}
                className="peer sr-only"
                aria-label={key.replace(/-/g, ' ')}
              />
              <span
                className={cn(
                  'grid aspect-square cursor-pointer place-items-center rounded-lg border transition-colors',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-brand',
                  values.icon === key
                    ? 'border-brand bg-brand-soft text-brand-text'
                    : 'border-transparent text-ink-2 hover:bg-subtle',
                )}
              >
                {createElement(CATEGORY_ICONS[key], { className: 'size-5', 'aria-hidden': true })}
              </span>
            </label>
          ))}
        </div>
        {errors.icon && <p className="mt-1.5 text-xs font-medium text-negative">{errors.icon}</p>}
      </fieldset>
    </form>
  );
}

export function CategoryFormModal({ open, category, defaultType = 'expense', onClose }) {
  const [saving, setSaving] = useState(false);
  const close = () => {
    if (!saving) onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={category ? 'Edit category' : 'New category'}
      fullScreenOnMobile
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <CategoryForm category={category} defaultType={defaultType} onSaved={onClose} onSavingChange={setSaving} />
    </Modal>
  );
}
