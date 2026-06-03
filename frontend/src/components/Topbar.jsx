import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';
import { ROLE_LABELS, ROLE_COLORS } from '../utils/constants';
import { Menu, LogOut, Bell, ChevronRight, KeyRound, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { changePassword } from '../api/auth';
import Modal from './Modal';

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/courses': 'Courses',
  '/fee-structure': 'Fee Structure',
  '/payments': 'Payments',
  '/payments/new': 'Record Payment',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
  '/users': 'User Management',
};

function getBreadcrumbs(pathname) {
  const paths = pathname.split('/').filter(Boolean);
  const crumbs = [];
  
  if (paths.length === 0) {
    return [{ title: 'Dashboard', path: '/' }];
  }
  
  let currentPath = '';
  paths.forEach((p, index) => {
    currentPath += `/${p}`;
    
    // Custom labels
    let title = p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ');
    if (pageTitles[currentPath]) {
      title = pageTitles[currentPath];
    } else if (index === 1 && paths[0] === 'students') {
      title = 'Student Profile';
    } else if (index === 1 && paths[0] === 'payments' && p === 'new') {
      title = 'Record Payment';
    }
    
    crumbs.push({ title, path: currentPath });
  });
  
  return crumbs;
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const initials = getInitials(user?.full_name || user?.username || '');
  const roleLabel = ROLE_LABELS[user?.role] || user?.role;
  const roleColor = ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-800';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/80 h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.path} className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-gray-900">{crumb.title}</span>
                ) : (
                  <Link to={crumb.path} className="text-gray-500 hover:text-gray-900 transition-colors">
                    {crumb.title}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-700 leading-tight">
                  {user?.full_name || user?.username}
                </p>
                <span className={`inline-block mt-0.5 badge text-[10px] px-2 py-0.5 ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-slide-in z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <KeyRound className="w-4 h-4 text-gray-400" />
                  Change Password
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label-field">Current Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input-field"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              placeholder="Min 8 chars, 1 uppercase, 1 digit"
            />
          </div>
          <div>
            <label className="label-field">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input-field"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="btn-ghost"
              disabled={isChangingPassword}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isChangingPassword}
            >
              {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Password
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
