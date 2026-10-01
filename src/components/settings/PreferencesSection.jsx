import { useState } from 'react';
import { Card, CardHeader } from '@/components/common/Card';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { THEME_OPTIONS } from '@/components/common/themeOptions';
import { useSettings } from '@/hooks/useSettings';
import { useThemePreference } from '@/hooks/useThemePreference';
import { useToast } from '@/hooks/useToast';
import { updateSettings } from '@/services/userService';
import { CURRENCY_OPTIONS } from '@/utils/currency';
import { assertOnline, getErrorMessage } from '@/utils/errors';

export function PreferencesSection() {
  const { settings } = useSettings();
  const { preference, changeTheme } = useThemePreference();
  const toast = useToast();
  const [savingCurrency, setSavingCurrency] = useState(false);

  const changeCurrency = async (currency) => {
    setSavingCurrency(true);
    try {
      assertOnline();
      await updateSettings({ currency });
      toast.success('Currency updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update the currency. Please try again.'));
    } finally {
      setSavingCurrency(false);
    }
  };

  return (
    <Card id="preferences" className="scroll-mt-20 p-4 sm:p-6">
      <CardHeader title="Preferences" description="Saved to your account and applied on every device." />
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Select
          label="Currency"
          value={settings.currency}
          options={CURRENCY_OPTIONS}
          onChange={(event) => changeCurrency(event.target.value)}
          disabled={savingCurrency}
          hint="Changes how amounts are displayed. Existing amounts are not converted."
        />
        <SegmentedControl label="Theme" value={preference} onChange={changeTheme} options={THEME_OPTIONS} />
      </div>
    </Card>
  );
}
