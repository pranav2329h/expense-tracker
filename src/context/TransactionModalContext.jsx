import { useCallback, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/useToast';
import { deleteTransaction } from '@/services/transactionService';
import { formatDate } from '@/utils/dates';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { TransactionModalContext } from './contexts';

/**
 * One add/edit dialog and one delete confirmation for the whole app, so any page
 * (or the mobile "Add" button) can open them.
 */
export function TransactionModalProvider({ children }) {
  const [modal, setModal] = useState({ open: false, transaction: null, defaults: null, key: 0 });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const { resolveCategory } = useCategories();
  const { formatSigned } = useCurrency();

  const openAddTransaction = useCallback((defaults = null) => {
    setModal((current) => ({ open: true, transaction: null, defaults, key: current.key + 1 }));
  }, []);

  const openEditTransaction = useCallback((transaction) => {
    setModal((current) => ({ open: true, transaction, defaults: null, key: current.key + 1 }));
  }, []);

  const requestDeleteTransaction = useCallback((transaction) => setPendingDelete(transaction), []);

  const closeModal = useCallback(() => setModal((current) => ({ ...current, open: false })), []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      assertOnline();
      await deleteTransaction(pendingDelete.id);
      toast.success('Transaction deleted.');
      setModal((current) => (current.transaction?.id === pendingDelete.id ? { ...current, open: false } : current));
      setPendingDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete transaction. Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  const value = useMemo(
    () => ({ openAddTransaction, openEditTransaction, requestDeleteTransaction }),
    [openAddTransaction, openEditTransaction, requestDeleteTransaction],
  );

  const deleteSummary = pendingDelete && (
    <div className="mt-4 rounded-xl border border-line bg-subtle px-4 py-3 text-sm">
      <p className="font-medium text-ink">{pendingDelete.description || resolveCategory(pendingDelete).name}</p>
      <p className="mt-0.5 text-ink-3">
        {formatSigned(pendingDelete.amount, pendingDelete.type)} · {formatDate(pendingDelete.date)}
      </p>
    </div>
  );

  return (
    <TransactionModalContext.Provider value={value}>
      {children}
      <TransactionModal
        open={modal.open}
        formKey={modal.key}
        transaction={modal.transaction}
        defaults={modal.defaults}
        onClose={closeModal}
        onRequestDelete={requestDeleteTransaction}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete transaction?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {deleteSummary}
      </ConfirmDialog>
    </TransactionModalContext.Provider>
  );
}
