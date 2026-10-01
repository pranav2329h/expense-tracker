import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Divider, FormAlert } from '@/components/auth/FormAlert';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { signInWithEmail, signInWithGoogle } from '@/firebase/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getErrorMessage, isSilentError } from '@/utils/errors';
import { validateEmail } from '@/utils/validation';

export default function Login() {
  useDocumentTitle('Sign in');
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  // On success the route guard redirects to the dashboard (or the page originally requested).
  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = validateEmail(values.email);
    const nextErrors = {};
    if (email.error) nextErrors.email = email.error;
    if (!values.password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending('email');
    setFormError('');
    try {
      await signInWithEmail(email.value, values.password);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to sign in. Please try again.'));
      setPending(null);
    }
  };

  const handleGoogle = async () => {
    setPending('google');
    setFormError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      if (!isSilentError(error)) setFormError(getErrorMessage(error, 'Google sign-in failed. Please try again.'));
      setPending(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-3">Sign in to continue tracking your finances.</p>

      <div className="mt-8">
        <GoogleSignInButton onClick={handleGoogle} loading={pending === 'google'} disabled={pending !== null} />
      </div>

      <Divider>or sign in with email</Divider>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <FormAlert>{formError}</FormAlert>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            value={values.password}
            onChange={update('password')}
            error={errors.password}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-text hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" fullWidth size="lg" loading={pending === 'email'} disabled={pending !== null}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-3">
        New here?{' '}
        <Link to="/register" state={location.state} className="font-medium text-brand-text hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
