import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { FormAlert } from '@/components/auth/FormAlert';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { sendPasswordReset } from '@/firebase/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getErrorMessage } from '@/utils/errors';
import { validateEmail } from '@/utils/validation';

export default function ForgotPassword() {
  useDocumentTitle('Reset password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validateEmail(email);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPending(true);
    setFormError('');
    try {
      await sendPasswordReset(result.value);
      setSentTo(result.value);
    } catch (err) {
      // Don't reveal whether an account exists for this email.
      if (err?.code === 'auth/user-not-found') setSentTo(result.value);
      else setFormError(getErrorMessage(err, 'Unable to send the reset email. Please try again.'));
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-positive-soft text-positive">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-2" role="status">
          If an account exists for <span className="font-medium text-ink">{sentTo}</span>, you'll receive a link to reset
          your password shortly. Remember to check your spam folder.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-3">Enter your account email and we'll send you a reset link.</p>

      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-4">
        <FormAlert>{formError}</FormAlert>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError('');
          }}
          error={error}
        />
        <Button type="submit" fullWidth size="lg" loading={pending}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}
