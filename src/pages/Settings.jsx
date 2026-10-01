import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { DataSection } from '@/components/settings/DataSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { signOutUser } from '@/firebase/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errors';

export default function Settings() {
  useDocumentTitle('Settings');
  const { hash } = useLocation();
  const toast = useToast();

  // Support links such as /settings#categories.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.info("You've been logged out.");
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to log out. Please try again.'));
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, preferences, categories and data." />
      <div className="space-y-4 sm:space-y-6">
        <ProfileSection />
        <PreferencesSection />
        <CategoryManager />
        <DataSection />
        <Card id="account" className="scroll-mt-20 p-4 sm:p-6">
          <CardHeader
            title="Account"
            description="Signing out removes access on this device until you sign in again."
            action={
              <Button variant="secondary" leftIcon={LogOut} onClick={handleLogout}>
                Log out
              </Button>
            }
          />
        </Card>
      </div>
    </>
  );
}
