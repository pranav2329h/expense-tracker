import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Divider, FormAlert } from '@/components/auth/FormAlert';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { registerWithEmail, signInWithGoogle } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getErrorMessage, isSilentError } from '@/utils/errors';
import { validateDisplayName, validateEmail, validateNewPassword } from '@/utils/validation';

export default function Register() {
  useDocumentTitle('Create account');
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = validateDisplayName(values.name);
    const email = validateEmail(values.email);
    const password = validateNewPassword(values.password);
    const nextErrors = {};
    if (name.error) nextErrors.name = name.error;
    if (email.error) nextErrors.email = email.error;
    if (password.error) nextErrors.password = password.error;
    if (!password.error && values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending('email');
    setFormError('');
    try {
      await registerWithEmail({ name: name.value, email: email.value, password: password.value });
      await refreshUser();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create your account. Please try again.'));
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
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-3">Start tracking expenses, income and budgets for free.</p>

      <div className="mt-8">
        <GoogleSignInButton onClick={handleGoogle} loading={pending === 'google'} disabled={pending !== null}>
          Sign up with Google
        </GoogleSignInButton>
      </div>

      <Divider>or sign up with email</Divider>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <FormAlert>{formError}</FormAlert>
        <Input label="Name" autoComplete="name" value={values.name} onChange={update('name')} error={errors.name} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
        />
        <Button type="submit" fullWidth size="lg" loading={pending === 'email'} disabled={pending !== null}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-3">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-medium text-brand-text hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
