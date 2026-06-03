import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Edit, ShieldOff, ShieldCheck, Users as UsersIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, createUser, updateUser, deleteUser } from '../api/settings';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '../utils/constants';

const emptyForm = {
  username: '',
  email: '',
  password: '',
  full_name: '',
  role: 'clerk',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : data.items || data.data || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!editing && !form.password) errs.password = 'Password is required';
    if (!editing && form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.role) errs.role = 'Role is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditing(user);
    setForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      full_name: user.full_name || '',
      role: user.role || 'clerk',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editing) {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
        };
        await updateUser(editing.id, payload);
        toast.success('User updated successfully');
      } else {
        await createUser(form);
        toast.success('User created successfully');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
      fetchUsers();
    } catch (error) {
      const msg = error?.response?.data?.detail || 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      if (toggleTarget.is_active) {
        await deleteUser(toggleTarget.id);
        toast.success('User deactivated');
      } else {
        await updateUser(toggleTarget.id, { is_active: true });
        toast.success('User activated');
      }
      setToggleTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setToggling(false);
    }
  };

  const getRoleBadge = (role) => {
    const colorClass = ROLE_COLORS[role] || 'bg-gray-100 text-gray-700';
    const label = ROLE_LABELS[role] || role;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {val ? val.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{val || '—'}</p>
            <p className="text-xs text-gray-500">@{row.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-600">{val || '—'}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (val) => getRoleBadge(val),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          val ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
        }`}>
          {val ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-500">{formatDate(val)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setToggleTarget(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? 'hover:bg-red-50 text-red-600'
                : 'hover:bg-emerald-50 text-emerald-600'
            }`}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system users and roles</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Role Legend */}
      <div className="card">
        <p className="text-xs text-gray-500 mb-2 font-medium">Role Permissions</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            {getRoleBadge('super_admin')}
            <span className="text-xs text-gray-400">Full access</span>
          </div>
          <div className="flex items-center gap-1.5">
            {getRoleBadge('admin')}
            <span className="text-xs text-gray-400">All except user mgmt</span>
          </div>
          <div className="flex items-center gap-1.5">
            {getRoleBadge('accountant')}
            <span className="text-xs text-gray-400">Finance operations</span>
          </div>
          <div className="flex items-center gap-1.5">
            {getRoleBadge('clerk')}
            <span className="text-xs text-gray-400">Student records</span>
          </div>
          <div className="flex items-center gap-1.5">
            {getRoleBadge('auditor')}
            <span className="text-xs text-gray-400">Read-only access</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        total={users.length}
        page={1}
        pageSize={users.length || 20}
        onPageChange={() => {}}
        loading={false}
        showSearch={false}
        emptyMessage="No users found"
        emptyIcon={<UsersIcon className="w-12 h-12" />}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); setErrors({}); }}
        title={editing ? 'Edit User' : 'Create User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input-field"
              placeholder="e.g. Rajesh Kumar"
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field"
                placeholder="username"
                disabled={!!editing}
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="label-field">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="user@college.edu.in"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {!editing && (
            <div>
              <label className="label-field">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="Minimum 8 characters (Upper, Lower, Digit)"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          )}

          <div>
            <label className="label-field">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="select-field"
            >
              <option value="super_admin">Super Admin — Full access</option>
              <option value="admin">Admin — All except user management</option>
              <option value="accountant">Accountant — Finance operations</option>
              <option value="clerk">Clerk — Student records</option>
              <option value="auditor">Auditor — Read-only access</option>
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); setErrors({}); }}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editing ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Active Confirmation */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActive}
        title={toggleTarget?.is_active ? 'Deactivate User' : 'Activate User'}
        message={
          toggleTarget?.is_active
            ? `Are you sure you want to deactivate "${toggleTarget?.full_name}"? They will no longer be able to log in.`
            : `Are you sure you want to activate "${toggleTarget?.full_name}"? They will regain access to the system.`
        }
        confirmText={toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.is_active ? 'destructive' : 'default'}
        loading={toggling}
      />
    </div>
  );
}
