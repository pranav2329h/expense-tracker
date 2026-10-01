import { useRef, useState } from 'react';
import { FileJson, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import { exportJsonBackup, exportTransactionsCsv, readBackupFile, runImport } from '@/services/backupService';
import { AppError, getErrorMessage } from '@/utils/errors';
import { planImport } from '@/utils/export';

const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count.toLocaleString('en-IN')} ${count === 1 ? singular : pluralForm}`;

/** Export (CSV / JSON backup) and import (JSON backup). All processing happens in the browser. */
export function DataSection() {
  const { categories, resolveCategory } = useCategories();
  const { budgets } = useBudgets();
  const { settings } = useSettings();
  const toast = useToast();
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(null);
  const [plan, setPlan] = useState(null);
  const [imported, setImported] = useState(0);

  const run = async (kind, task) => {
    setBusy(kind);
    try {
      await task();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () =>
    run('csv', async () => {
      const count = await exportTransactionsCsv(resolveCategory);
      toast.success(`Exported ${plural(count, 'transaction')} to CSV.`);
    });

  const exportJson = () =>
    run('json', async () => {
      await exportJsonBackup({ categories, budgets, settings, resolveCategory });
      toast.success('Backup exported.');
    });

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    run('read', async () => {
      const parsed = await readBackupFile(file);
      const nextPlan = planImport(parsed, { categories, budgets });
      if (nextPlan.transactions.length + nextPlan.categories.length + nextPlan.budgets.length === 0) {
        throw new AppError('This backup has no new data to import.', 'import/empty');
      }
      setPlan(nextPlan);
    });
  };

  const confirmImport = () =>
    run('import', async () => {
      setImported(0);
      await runImport(plan, setImported);
      setPlan(null);
      toast.success('Data imported successfully.');
    });

  const skippedTotal = plan ? plan.skipped.transactions + plan.skipped.categories + plan.skipped.budgets : 0;

  return (
    <Card id="data" className="scroll-mt-20 p-4 sm:p-6">
      <CardHeader
        title="Data"
        description="Download your data or restore a backup. Files are created and read on your device — nothing is sent to third parties."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Button variant="secondary" leftIcon={FileSpreadsheet} onClick={exportCsv} loading={busy === 'csv'} disabled={busy !== null}>
          Export CSV
        </Button>
        <Button variant="secondary" leftIcon={FileJson} onClick={exportJson} loading={busy === 'json'} disabled={busy !== null}>
          Export JSON backup
        </Button>
        <Button
          variant="secondary"
          leftIcon={Upload}
          onClick={() => fileInput.current?.click()}
          loading={busy === 'read'}
          disabled={busy !== null}
        >
          Import JSON backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
        />
      </div>
      <p className="mt-3 text-xs text-ink-3">
        CSV includes date, type, amount, category, payment method and description. The JSON backup also includes your
        categories and budgets, and can be imported back into any account.
      </p>

      <ConfirmDialog
        open={Boolean(plan)}
        tone="primary"
        title="Import backup?"
        description={plan ? `You are about to import ${plural(plan.transactions.length, 'transaction')}.` : ''}
        confirmLabel="Import"
        loading={busy === 'import'}
        onConfirm={confirmImport}
        onCancel={() => setPlan(null)}
      >
        {plan && (
          <div className="mt-4 space-y-3 text-sm text-ink-2">
            <ul className="list-disc space-y-1 pl-5">
              {plan.categories.length > 0 && <li>{plural(plan.categories.length, 'new category', 'new categories')}</li>}
              {plan.budgets.length > 0 && <li>{plural(plan.budgets.length, 'new budget')}</li>}
              {skippedTotal > 0 && <li>{plural(skippedTotal, 'invalid or duplicate entry', 'invalid or duplicate entries')} will be skipped</li>}
            </ul>
            <p className="text-xs text-ink-3">
              Transactions that already exist from this backup are restored rather than duplicated. Existing categories
              and budgets are kept.
            </p>
            {busy === 'import' && plan.transactions.length > 0 && (
              <div>
                <ProgressBar value={(imported / plan.transactions.length) * 100} label="Import progress" />
                <p className="mt-1.5 text-xs text-ink-3" aria-live="polite">
                  Imported {imported.toLocaleString('en-IN')} of {plan.transactions.length.toLocaleString('en-IN')}…
                </p>
              </div>
            )}
          </div>
        )}
      </ConfirmDialog>
    </Card>
  );
}
