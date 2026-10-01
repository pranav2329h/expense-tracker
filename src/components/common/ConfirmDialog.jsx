import { useRef } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

/**
 * Confirmation step for destructive or bulk actions. Focus starts on Cancel so an
 * accidental Enter never confirms.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  const cancelRef = useRef(null);
  const close = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={close} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-ink-2">{description}</p>}
      {children}
    </Modal>
  );
}
