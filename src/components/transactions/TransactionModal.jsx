import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { createTransaction, updateTransaction } from '@/services/transactionService';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { rememberPaymentMethod } from '@/utils/preferences';
import { TransactionForm } from './TransactionForm';

const FORM_ID = 'transaction-form';

/**
 * Add / edit transaction dialog (full screen on phones). Saves to Firestore; the live
 * listeners update every view immediately, then the dialog closes with a toast.
 */
export function TransactionModal({ open, formKey, transaction, defaults, onClose, onRequestDelete }) {
  const isEdit = Boolean(transaction);
  const { byId } = useCategories();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (value) => {
    setSaving(true);
    try {
      assertOnline();
      if (isEdit) {
        await updateTransaction(transaction.id, value, byId);
        toast.success('Transaction updated.');
      } else {
        await createTransaction(value, byId);
        toast.success('Transaction added successfully.');
      }
      rememberPaymentMethod(value.paymentMethod);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save transaction. Please check your connection and try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? 'Edit transaction' : 'Add transaction'}
      fullScreenOnMobile
      footer={
        <>
          {isEdit && (
            <Button
              variant="danger-ghost"
              leftIcon={Trash2}
              onClick={() => onRequestDelete(transaction)}
              disabled={saving}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {isEdit ? 'Save changes' : 'Add transaction'}
          </Button>
        </>
      }
    >
      <TransactionForm
        key={formKey}
        id={FORM_ID}
        transaction={transaction}
        defaults={defaults}
        onSubmit={handleSubmit}
        autoFocus={!isEdit}
      />
    </Modal>
  );
}
