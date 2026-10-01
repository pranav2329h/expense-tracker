import { useState } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { updateDisplayName } from '@/services/userService';
import { LIMITS } from '@/utils/constants';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { validateDisplayName } from '@/utils/validation';

const PROVIDER_LABELS = { 'google.com': 'Google', password: 'Email & password' };

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.displayName ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const signInMethods = (user?.providerIds ?? []).map((id) => PROVIDER_LABELS[id] ?? id).join(', ');
  const dirty = name.trim() !== (user?.displayName ?? '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validateDisplayName(name);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaving(true);
    try {
      assertOnline();
      await updateDisplayName(result.value);
      await refreshUser();
      setName(result.value);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="profile" className="scroll-mt-20 p-4 sm:p-6">
      <CardHeader title="Profile" description="How you appear in the app." />
      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        <div className="flex items-center gap-4 sm:flex-col sm:items-center">
          <Avatar src={user?.photoURL} name={user?.displayName} email={user?.email} size="lg" />
          <p className="text-xs text-ink-3 sm:max-w-28 sm:text-center">
            {user?.photoURL ? 'Photo from your Google account' : 'Initials are used when no photo is available'}
          </p>
        </div>
        <form noValidate onSubmit={handleSubmit} className="min-w-0 flex-1 space-y-4">
          <Input
            label="Name"
            autoComplete="name"
            value={name}
            maxLength={LIMITS.displayNameMax}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            error={error}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Email</p>
            <p className="truncate rounded-lg border border-line bg-subtle px-3 py-2.5 text-sm text-ink-2">{user?.email}</p>
            {signInMethods && <p className="mt-1.5 text-xs text-ink-3">Signed in with {signInMethods}</p>}
          </div>
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save profile
          </Button>
        </form>
      </div>
    </Card>
  );
}
