import { useCallback } from 'react';
import { updateSettings } from '@/services/userService';
import { getErrorMessage } from '@/utils/errors';
import { useTheme } from './useTheme';
import { useToast } from './useToast';

/**
 * Changes the theme immediately on this device and saves it to the user's
 * Firestore settings so it follows them to other devices.
 */
export function useThemePreference() {
  const { preference, setPreference } = useTheme();
  const toast = useToast();

  const changeTheme = useCallback(
    async (next) => {
      setPreference(next);
      try {
        await updateSettings({ theme: next });
      } catch (error) {
        toast.error(getErrorMessage(error, 'Your theme was applied here but could not be saved to your account.'));
      }
    },
    [setPreference, toast],
  );

  return { preference, changeTheme };
}
