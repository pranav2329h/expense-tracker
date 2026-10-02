import { ArrowLeftRight, ChartPie, HandCoins, House, LayoutDashboard, Settings, Target } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard, mobileIcon: House },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/lend-borrow', label: 'Lend & Borrow', icon: HandCoins },
  { to: '/analytics', label: 'Analytics', icon: ChartPie },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const PAGE_TITLES = Object.fromEntries(NAV_ITEMS.map((item) => [item.to, item.label]));
