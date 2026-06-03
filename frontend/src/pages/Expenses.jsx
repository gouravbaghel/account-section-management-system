import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Filter, X, Receipt, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EXPENSE_CATEGORIES, PAYMENT_MODES, ROLES, DEFAULT_PAGE_SIZE } from '../utils/constants';

const emptyForm = {
  category: '',
  description: '',
  amount: '',
  vendor_name: '',
  payment_mode: 'cash',
  bill_number: '',
  expense_date: new Date().toISOString().split('T')[0],
  remarks: '',
};

export default function Expenses() {
  const { hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: DEFAULT_PAGE_SIZE };
      if (filterCategory) params.category = filterCategory;
      if (filterFrom) params.from_date = filterFrom;
      if (filterTo) params.to_date = filterTo;
      const res = await getExpenses(params);
      setExpenses(res.items || res.data || res.expenses || (Array.isArray(res) ? res : []));
      setTotal(res.total || res.count || (Array.isArray(res) ? res.length : 0));
    } catch (error) {
      toast.error('Failed to load expenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterFrom, filterTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalThisMonth = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const d = new Date(exp.expense_date || exp.date || exp.created_at);
      const now = new Date();
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        return sum + (Number(exp.amount) || 0);
      }
      return sum;
    }, 0);
  }, [expenses]);

  const validate = () => {
    const errs = {};
    if (!form.category) errs.category = 'Category is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!form.expense_date) errs.expense_date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditing(expense);
    setForm({
      category: expense.category || '',
      description: expense.description || '',
      amount: expense.amount || '',
      vendor_name: expense.vendor_name || '',
      payment_mode: expense.payment_mode || 'cash',
      bill_number: expense.bill_number || '',
      expense_date: expense.expense_date || expense.date || '',
      remarks: expense.remarks || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };
      if (editing) {
        await updateExpense(editing.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await createExpense(payload);
        toast.success('Expense recorded successfully');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
      fetchExpenses();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      toast.success('Expense deleted successfully');
      setDeleteTarget(null);
      fetchExpenses();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to delete expense';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (val) => {
    const cat = EXPENSE_CATEGORIES.find((c) => c.value === val);
    return cat ? cat.label : val || '—';
  };

  const getCategoryColor = (cat) => {
    const colors = {
      salary: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      electricity: 'bg-amber-100 text-amber-800',
      water: 'bg-cyan-100 text-cyan-800',
      stationery: 'bg-pink-100 text-pink-800',
      equipment: 'bg-purple-100 text-purple-800',
      transport: 'bg-green-100 text-green-800',
      events: 'bg-indigo-100 text-indigo-800',
      library: 'bg-teal-100 text-teal-800',
      lab: 'bg-orange-100 text-orange-800',
      internet: 'bg-violet-100 text-violet-800',
      furniture: 'bg-rose-100 text-rose-800',
      miscellaneous: 'bg-gray-100 text-gray-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'expense_date',
      label: 'Date',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm text-gray-700">{formatDate(val || row.date || row.created_at)}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(val)}`}>
          {getCategoryLabel(val)}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (val) => (
        <span className="text-sm text-gray-900 line-clamp-1">{val || '—'}</span>
      ),
    },
    {
      key: 'vendor_name',
      label: 'Vendor',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-600">{val || '—'}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (val) => <span className="text-sm font-semibold text-gray-900">{formatCurrency(val)}</span>,
    },
    {
      key: 'payment_mode',
      label: 'Mode',
      sortable: true,
      render: (val) => {
        const mode = PAYMENT_MODES.find((m) => m.value === val);
        return <span className="text-sm text-gray-600">{mode ? mode.label : val || '—'}</span>;
      },
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
            title="Edit Expense"
          >
            <Edit className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              title="Delete Expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage college expenses</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Monthly Summary Card */}
      <div className="card bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <IndianRupee className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-indigo-100">Total Expenses This Month</p>
            <p className="text-3xl font-bold">{formatCurrency(totalThisMonth)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-wrap gap-3 flex-1">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="select-field max-w-[200px]"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
                className="input-field max-w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                className="input-field max-w-[160px]"
              />
            </div>
            {(filterCategory || filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterCategory(''); setFilterFrom(''); setFilterTo(''); setPage(1); }}
                className="btn-ghost text-xs gap-1 py-2"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={expenses}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        showSearch={false}
        emptyMessage="No expenses found"
        emptyIcon={<Receipt className="w-12 h-12" />}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); setErrors({}); }}
        title={editing ? 'Edit Expense' : 'Record Expense'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Category <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="select-field"
              >
                <option value="">Select Category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="label-field">Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="input-field pl-7"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Description <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                placeholder="Brief description of the expense"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="label-field">Vendor / Payee</label>
              <input
                type="text"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                className="input-field"
                placeholder="Vendor name"
              />
            </div>
            <div>
              <label className="label-field">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                className="select-field"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Bill Number</label>
              <input
                type="text"
                value={form.bill_number}
                onChange={(e) => setForm({ ...form, bill_number: e.target.value })}
                className="input-field"
                placeholder="Invoice / bill number"
              />
            </div>
            <div>
              <label className="label-field">Expense Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="input-field"
              />
              {errors.expense_date && <p className="text-xs text-red-500 mt-1">{errors.expense_date}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="input-field resize-none"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
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
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editing ? 'Updating...' : 'Recording...'}
                </div>
              ) : (
                editing ? 'Update Expense' : 'Record Expense'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatCurrency(deleteTarget?.amount)}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
