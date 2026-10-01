import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { THEME_PREFERENCES } from '@/utils/constants';
import { ThemeContext } from './contexts';

// Mirrors the key read by the inline script in index.html (prevents a theme flash).
const STORAGE_KEY = 'expense-tracker:theme';
const THEME_COLORS = { light: '#f6f6f4', dark: '#0d0d0d' };

function readStoredPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEME_PREFERENCES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Theme preference (light / dark / system). Stored locally for an instant first
 * paint and synced to the user's Firestore settings once signed in (see SetupGate).
 */
export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedTheme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolvedTheme]);
  }, [resolvedTheme]);

  const setPreference = useCallback((next) => {
    if (!THEME_PREFERENCES.includes(next)) return;
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the preference still applies for this session */
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
