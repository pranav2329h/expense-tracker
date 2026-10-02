import { createElement, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Ellipsis, LogOut, Plus } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { THEME_OPTIONS } from '@/components/common/themeOptions';
import { useThemePreference } from '@/hooks/useThemePreference';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from './navigation';
import { UserMenuCard } from './UserMenuCard';

const PRIMARY = NAV_ITEMS.filter((item) => ['/dashboard', '/transactions', '/budgets'].includes(item.to));
const SECONDARY = NAV_ITEMS.filter((item) => ['/lend-borrow', '/analytics', '/settings'].includes(item.to));

const itemClass = (active) =>
  cn(
    'flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium transition-colors',
    active ? 'text-brand-text' : 'text-ink-3 hover:text-ink',
  );

function NavItem({ item }) {
  return (
    <NavLink to={item.to} className={({ isActive }) => itemClass(isActive)}>
      {({ isActive }) => (
        <>
          {createElement(item.mobileIcon ?? item.icon, {
            className: 'size-[22px]',
            strokeWidth: isActive ? 2.25 : 1.75,
            'aria-hidden': true,
          })}
          {item.mobileLabel ?? item.label}
        </>
      )}
    </NavLink>
  );
}

/** Bottom navigation for phones and tablets: Home, Transactions, Add, Budgets, More. */
export function MobileNav({ onLogout }) {
  const { openAddTransaction } = useTransactionModal();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { preference, changeTheme } = useThemePreference();
  const moreActive = SECONDARY.some((item) => pathname.startsWith(item.to));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-safe backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-2">
          <li>
            <NavItem item={PRIMARY[0]} />
          </li>
          <li>
            <NavItem item={PRIMARY[1]} />
          </li>
          <li className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => openAddTransaction()}
              className="-mt-5 flex flex-col items-center gap-1 text-[11px] font-medium text-ink-2"
            >
              <span className="grid size-12 place-items-center rounded-full bg-brand text-white shadow-lg ring-4 ring-surface transition-colors hover:bg-brand-hover">
                <Plus className="size-6" aria-hidden="true" />
              </span>
              Add
            </button>
          </li>
          <li>
            <NavItem item={PRIMARY[2]} />
          </li>
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(itemClass(moreActive), 'w-full')}
            >
              <Ellipsis className="size-[22px]" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <div className="space-y-5">
          <UserMenuCard />
          <ul className="space-y-1">
            {SECONDARY.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                      isActive ? 'bg-brand-soft text-brand-text' : 'text-ink hover:bg-subtle',
                    )
                  }
                >
                  {createElement(item.icon, { className: 'size-5', 'aria-hidden': true })}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <SegmentedControl label="Theme" value={preference} onChange={changeTheme} options={THEME_OPTIONS} />
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-negative hover:bg-negative-soft"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </Modal>
    </>
  );
}
