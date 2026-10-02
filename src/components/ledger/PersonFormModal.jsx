import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { useLedger } from '@/hooks/useLedger';
import { useToast } from '@/hooks/useToast';
import { renamePerson } from '@/services/ledgerService';
import { LIMITS } from '@/utils/constants';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { findPersonByName, validatePersonName } from '@/utils/validation';

const FORM_ID = 'person-form';

function PersonForm({ person, onSaved, onSavingChange }) {
  const { people } = useLedger();
  const toast = useToast();
  const [name, setName] = useState(person.name);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validatePersonName(name);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (findPersonByName(people, result.value, person.id)) {
      setError(`You already have someone called "${result.value}".`);
      return;
    }
    onSavingChange(true);
    try {
      assertOnline();
      await renamePerson(person, result.value, people);
      toast.success('Name updated.');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to rename. Please try again.'));
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={name}
        maxLength={LIMITS.personNameMax}
        onChange={(event) => {
          setName(event.target.value);
          setError('');
        }}
        error={error}
        data-autofocus
      />
    </form>
  );
}

export function PersonFormModal({ open, person, onClose }) {
  const [saving, setSaving] = useState(false);
  const close = () => {
    if (!saving) onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Rename person"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      {person && <PersonForm person={person} onSaved={onClose} onSavingChange={setSaving} />}
    </Modal>
  );
}
