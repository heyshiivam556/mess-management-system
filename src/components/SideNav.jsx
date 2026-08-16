import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, Megaphone,
  Wallet, Users, LogOut, ChefHat, Hammer, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────
   SideNav — Left sidebar for Committee & Super Admin panels
   Desktop-optimized, collapsible on smaller screens.
───────────────────────────────────────────────────────── */

const COMMITTEE_TABS = [
  { path: '/committee/dashboard',    label: 'Dashboard',     Icon: LayoutDashboard },
  { path: '/committee/menu',         label: 'Menu Manager',  Icon: CalendarDays    },
  { path: '/committee/announce',     label: 'Announcements', Icon: Megaphone       },
  { path: '/committee/ledger',       label: 'Ledger',        Icon: Wallet          },
  { path: '/committee/users',        label: 'Workers',       Icon: Users           },
  { path: '/committee/feedback',     label: 'Feedback',      Icon: MessageSquare   },
];

const ADMIN_TABS = [
  { path: '/superadmin/dashboard',   label: 'Control Panel', Icon: LayoutDashboard },
  { path: '/superadmin/committee',   label: 'Committee',     Icon: Users           },
  { path: '/superadmin/workers',     label: 'Workers',       Icon: Hammer          },
  { path: '/superadmin/succession',  label: 'Succession',    Icon: ChefHat         },
  { path: '/superadmin/feedback',    label: 'Feedback',      Icon: MessageSquare   },
];

export default function SideNav({ variant = 'committee' }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const tabs = variant === 'committee' ? COMMITTEE_TABS : ADMIN_TABS;

  return (
    <aside className="no-print w-64 min-h-screen flex flex-col border-r-2 border-brand-dark bg-brand-bg sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b-2 border-brand-dark">
        <h1 className="font-serif font-bold text-2xl text-brand-dark leading-tight">
          Mess<span className="text-brand-gold">App</span>
        </h1>
        <p className="text-xs font-sans text-brand-light mt-0.5 uppercase tracking-widest">
          GEC Sheikhpura
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.97 }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-brutal text-sm font-sans font-medium
                transition-all duration-150 w-full text-left
                ${isActive
                  ? 'bg-brand-dark text-brand-bg shadow-brutal-sm'
                  : 'text-brand-dark hover:bg-brand-primary/40'}
              `}
            >
              <tab.Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {tab.label}
            </motion.button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t-2 border-brand-dark">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-primary border-2 border-brand-dark flex items-center justify-center font-serif font-bold text-sm">
            {user?.displayName?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-semibold text-sm truncate">{user?.displayName}</p>
            <p className="font-sans text-xs text-brand-light capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-brutal text-sm font-sans font-medium text-brand-dark hover:bg-brand-secondary/40 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
