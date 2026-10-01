import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { FormAlert } from '@/components/auth/FormAlert';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Logo } from '@/components/common/Logo';
import { Select } from '@/components/common/Select';
import { signOutUser } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { completeOnboarding } from '@/services/userService';
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY, getCurrencySymbol } from '@/utils/currency';
import { assertOnline, getErrorMessage } from '@/utils/errors';
import { validateAmount } from '@/utils/validation';

/**
 * First-login setup. Creates settings, profile and default categories in one atomic
 * write (plus an optional monthly budget). Everything here is optional — "Skip"
 * uses sensible defaults.
 */
export default function Onboarding() {
  useDocumentTitle('Welcome');
  const { user } = useAuth();
  const { preference } = useTheme();
  const toast = useToast();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [budget, setBudget] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(null);

  const finish = async (skip) => {
    let monthlyBudget = '';
    if (!skip && budget.trim()) {
      const { error } = validateAmount(budget);
      if (error) {
        setBudgetError(error);
        return;
      }
      monthlyBudget = budget;
    }

    setPending(skip ? 'skip' : 'start');
    setFormError('');
    try {
      assertOnline();
      await completeOnboarding({ currency, monthlyBudget, theme: preference });
      toast.success("You're all set! Add your first transaction to get started.");
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to finish setting up. Please try again.'));
      setPending(null);
    }
  };

  const firstName = user?.displayName?.split(' ')[0];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink-3">Let's set up your expense tracker.</p>

          <form
            noValidate
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              finish(false);
            }}
          >
            <FormAlert>{formError}</FormAlert>
            <Select
              label="Currency"
              value={currency}
              options={CURRENCY_OPTIONS}
              onChange={(event) => setCurrency(event.target.value)}
            />
            <Input
              label="Monthly budget"
              optional
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 30000"
              prefix={getCurrencySymbol(currency)}
              value={budget}
              onChange={(event) => {
                setBudget(event.target.value);
                setBudgetError('');
              }}
              error={budgetError}
              hint="You'll get alerts at 80%, 90% and 100%. You can change this any time."
            />
            <Button type="submit" fullWidth size="lg" loading={pending === 'start'} disabled={pending !== null}>
              Get started
            </Button>
          </form>

          <div className="mt-3 text-center">
            <Button variant="ghost" onClick={() => finish(true)} loading={pending === 'skip'} disabled={pending !== null}>
              Skip for now
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-ink-3">
            We'll add common categories like Food, Rent and Salary — you can customise them later.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-ink-3">
          Not {user?.email}?{' '}
          <button type="button" onClick={() => signOutUser()} className="font-medium text-brand-text hover:underline">
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
