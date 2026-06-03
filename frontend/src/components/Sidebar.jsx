import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  ScrollText,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from 'lucide-react';

const menuItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CLERK, ROLES.AUDITOR],
  },
  {
    path: '/students',
    label: 'Students',
    icon: GraduationCap,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CLERK, ROLES.AUDITOR],
  },
  {
    path: '/courses',
    label: 'Courses',
    icon: BookOpen,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLERK, ROLES.AUDITOR],
  },
  {
    path: '/fee-structure',
    label: 'Fee Structure',
    icon: Receipt,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.AUDITOR],
  },
  {
    path: '/payments',
    label: 'Payments',
    icon: CreditCard,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.AUDITOR],
  },
  {
    path: '/expenses',
    label: 'Expenses',
    icon: Wallet,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.AUDITOR],
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.AUDITOR],
  },
  {
    path: '/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR],
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    path: '/users',
    label: 'Users',
    icon: Users,
    roles: [ROLES.SUPER_ADMIN],
  },
];

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }) {
  const { user } = useAuth();
  const location = useLocation();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 
        text-white transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/25 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="lg:block">
              <h1 className="text-sm font-bold leading-tight">College</h1>
              <p className="text-xs text-slate-400">Account Section</p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative
                ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
                ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-300 shadow-lg shadow-primary-600/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
              }`} />
              {!isCollapsed && <span className="lg:block">{item.label}</span>}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                  whitespace-nowrap z-50 shadow-xl hidden lg:block">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block p-3 border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-white/5 
            text-slate-400 hover:text-white transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
