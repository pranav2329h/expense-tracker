import { createElement } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const VARIANTS = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-hover',
  secondary: 'border border-line-strong bg-surface text-ink shadow-xs hover:bg-subtle',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
  danger: 'bg-danger text-white shadow-sm hover:bg-danger-hover',
  'danger-ghost': 'text-negative hover:bg-negative-soft',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
};

const ICON_SIZES = { sm: 'size-4', md: 'size-4', lg: 'size-5' };

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  ...props
}) {
  const iconClass = ICON_SIZES[size];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className={cn(iconClass, 'animate-spin')} aria-hidden="true" />
      ) : (
        leftIcon && createElement(leftIcon, { className: iconClass, 'aria-hidden': true })
      )}
      {children}
      {rightIcon && !loading && createElement(rightIcon, { className: iconClass, 'aria-hidden': true })}
    </button>
  );
}

/** Square icon button. `label` is required: it becomes the accessible name and tooltip. */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        size === 'sm' ? 'size-8' : 'size-10',
        className,
      )}
      {...props}
    >
      {createElement(icon, { className: size === 'sm' ? 'size-4' : 'size-5', 'aria-hidden': true })}
    </button>
  );
}
