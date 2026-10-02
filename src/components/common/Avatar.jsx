import { useState } from 'react';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
};

function getInitials(text) {
  const parts = (text || '?')
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return initials.toUpperCase();
}

/** Profile photo with an initials fallback (also used if the image fails to load). */
export function Avatar({ src, name, email, size = 'md', className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  if (showImage) {
    return (
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-line', SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand-text',
        SIZES[size],
        className,
      )}
    >
      {getInitials(name || email)}
    </span>
  );
}
