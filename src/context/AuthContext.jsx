import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { AuthContext } from './contexts';

function toAppUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL ?? null,
    providerIds: firebaseUser.providerData.map((provider) => provider.providerId),
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, initializing: true });

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) => {
        setState({ user: toAppUser(firebaseUser), initializing: false });
      }),
    [],
  );

  /** Re-reads the Firebase user after profile changes (e.g. a new display name). */
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setState((current) => ({ ...current, user: toAppUser(auth.currentUser) }));
  }, []);

  const value = useMemo(
    () => ({ user: state.user, initializing: state.initializing, refreshUser }),
    [state, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
