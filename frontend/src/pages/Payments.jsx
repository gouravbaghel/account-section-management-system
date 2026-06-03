import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, XCircle, Filter, X, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPayments, cancelPayment, getReceiptPdf } from '../api/payments';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PAYMENT_MODES, ROLES, DEFAULT_PAGE_SIZE } from '../utils/constants';

const PAYMENT_STATUSES = [
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'reversed', label: 'Reversed' },
];

export default function Payments() {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterMode, setFilterMode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: DEFAULT_PAGE_SIZE };
      if (filterMode) params.payment_mode = filterMode;
      if (filterStatus) params.status = filterStatus;
      if (filterFrom) params.from_date = filterFrom;
      if (filterTo) params.to_date = filterTo;
      const res = await getPayments(params);
      setPayments(res.items || res.data || res.payments || (Array.isArray(res) ? res : []));
      setTotal(res.total || res.count || (Array.isArray(res) ? res.length : 0));
    } catch (error) {
      toast.error('Failed to load payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filterMode, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDownloadReceipt = async (paymentId) => {
    setDownloadingReceipt(paymentId);
    try {
      const blob = await getReceiptPdf(paymentId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    setCancelling(true);
    try {
      await cancelPayment(cancelTarget.id, cancelReason);
      toast.success('Payment cancelled successfully');
      setCancelTarget(null);
      setCancelReason('');
      fetchPayments();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to cancel payment';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const getPaymentModeLabel = (mode) => {
    const found = PAYMENT_MODES.find((m) => m.value === mode);
    return found ? found.label : mode || '—';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      reversed: 'bg-amber-100 text-amber-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const getModeColor = (mode) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      upi: 'bg-purple-100 text-purple-800',
      neft: 'bg-blue-100 text-blue-800',
      cheque: 'bg-amber-100 text-amber-800',
      dd: 'bg-orange-100 text-orange-800',
      card: 'bg-pink-100 text-pink-800',
      online: 'bg-cyan-100 text-cyan-800',
    };
    return colors[mode?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const columns = [
    {
      key: 'receipt_number',
      label: 'Receipt #',
      sortable: true,
      render: (val) => <span className="font-mono text-sm font-medium text-gray-900">{val || '—'}</span>,
    },
    {
      key: 'student_name',
      label: 'Student',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm text-gray-900">{val || row.student?.name || '—'}</span>
      ),
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
      render: (val, row) => {
        const mode = val || row.mode;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeColor(mode)}`}>
            {getPaymentModeLabel(mode)}
          </span>
        );
      },
    },
    {
      key: 'payment_date',
      label: 'Date',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm text-gray-600">{formatDate(val || row.date || row.created_at)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(val)}`}>
          {val ? val.charAt(0).toUpperCase() + val.slice(1) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleDownloadReceipt(row.id)}
            disabled={downloadingReceipt === row.id}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors disabled:opacity-50"
            title="Download Receipt"
          >
            {downloadingReceipt === row.id ? (
              <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
          {isAdmin && row.status !== 'cancelled' && row.status !== 'reversed' && (
            <button
              onClick={() => setCancelTarget(row)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              title="Cancel Payment"
            >
              <XCircle className="w-4 h-4" />
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
          <h1 className="page-header">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all payment records</p>
        </div>
        <button onClick={() => navigate('/payments/new')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-wrap gap-3 flex-1">
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
            <select
              value={filterMode}
              onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
              className="select-field max-w-[170px]"
            >
              <option value="">All Modes</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="select-field max-w-[160px]"
            >
              <option value="">All Statuses</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(filterFrom || filterTo || filterMode || filterStatus) && (
              <button
                onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterMode(''); setFilterStatus(''); setPage(1); }}
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
        data={payments}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        searchPlaceholder="Search by receipt number or student..."
        emptyMessage="No payments found"
        emptyIcon={<CreditCard className="w-12 h-12" />}
      />

      {/* Cancel Payment Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => { setCancelTarget(null); setCancelReason(''); }}
        title="Cancel Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm text-red-800">
              You are about to cancel payment <strong>{cancelTarget?.receipt_number}</strong> for{' '}
              <strong>{formatCurrency(cancelTarget?.amount)}</strong>
            </p>
          </div>

          <div>
            <label className="label-field">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Please provide the reason for cancellation..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => { setCancelTarget(null); setCancelReason(''); }}
              className="btn-secondary"
              disabled={cancelling}
            >
              Keep Payment
            </button>
            <button
              onClick={handleCancel}
              className="btn-danger gap-2"
              disabled={cancelling || !cancelReason.trim()}
            >
              {cancelling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Cancel Payment
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
