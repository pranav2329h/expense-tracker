import { createElement } from 'react';
import { NavLink } from 'react-router';
import { LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Logo } from '@/components/common/Logo';
import { useTransactionModal } from '@/hooks/useTransactionModal';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from './navigation';
import { UserMenuCard } from './UserMenuCard';

/** Desktop navigation (lg and up). */
export function Sidebar({ onLogout }) {
  const { openAddTransaction } = useTransactionModal();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <div className="px-4 pt-2 pb-4">
        <Button fullWidth leftIcon={Plus} onClick={() => openAddTransaction()}>
          Add transaction
        </Button>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-soft text-brand-text' : 'text-ink-2 hover:bg-subtle hover:text-ink',
                  )
                }
              >
                {createElement(item.icon, { className: 'size-[18px]', 'aria-hidden': true })}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-line p-4">
        <UserMenuCard />
        <Button variant="ghost" size="sm" fullWidth leftIcon={LogOut} onClick={onLogout} className="justify-start">
          Log out
        </Button>
      </div>
    </aside>
  );
}
