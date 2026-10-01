import { useContext } from 'react';
import { SettingsContext } from '@/context/contexts';

/** { settings: { currency, theme }, status, error, offline } */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <UserDataProvider>.');
  return context;
}
