import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, CreditCard, Download, User, Phone, Mail, MapPin,
  BookOpen, Hash, Calendar, Shield, GraduationCap, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStudent } from '../api/students';
import { getStudentFees } from '../api/fees';
import { getPayments, getReceiptPdf } from '../api/payments';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, getInitials, getStatusColor } from '../utils/formatters';
import { PAYMENT_MODES } from '../utils/constants';

const TABS = [
  { key: 'fees', label: 'Fee Summary' },
  { key: 'payments', label: 'Payment History' },
  { key: 'scholarships', label: 'Scholarships' },
];

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scholarships, setScholarships] = useState([]);
  const [activeTab, setActiveTab] = useState('fees');
  const [downloadingReceipt, setDownloadingReceipt] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentData, feesData, paymentsData, scholarshipsData] = await Promise.all([
        getStudent(id),
        getStudentFees(id).catch(() => ({ data: [] })),
        getPayments({ student_id: id, page_size: 100 }).catch(() => ({ data: [] })),
        import('../api/scholarships').then(m => m.getScholarships({ student_id: id })).catch(() => ({ items: [] })),
      ]);
      setStudent(studentData.data || studentData);
      setFees(feesData?.items || feesData?.data || feesData?.fees || feesData || []);
      const paymentsList = paymentsData?.items || paymentsData?.data || paymentsData?.payments || paymentsData || [];
      setPayments(Array.isArray(paymentsList) ? paymentsList : []);
      setScholarships(scholarshipsData?.items || []);
    } catch (error) {
      toast.error('Failed to load student profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getPaymentModeLabel = (mode) => {
    const found = PAYMENT_MODES.find((m) => m.value === mode);
    return found ? found.label : mode || '—';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      reversed: 'bg-amber-100 text-amber-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const getFeeStatusColor = (status) => {
    const colors = {
      paid: 'bg-emerald-100 text-emerald-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/students')} className="btn-ghost gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
        <EmptyState
          icon={User}
          title="Student Not Found"
          description="The student you're looking for doesn't exist or has been removed."
          actionLabel="Back to Students"
          onAction={() => navigate('/students')}
        />
      </div>
    );
  }

  const infoItems = [
    { icon: Hash, label: 'Admission No', value: student.admission_number },
    { icon: BookOpen, label: 'Course', value: student.course_name || student.course?.name },
    { icon: GraduationCap, label: 'Branch', value: student.branch },
    { icon: Calendar, label: 'Semester', value: student.semester },
    { icon: Calendar, label: 'Batch', value: student.batch },
    { icon: Phone, label: 'Phone', value: student.phone },
    { icon: Mail, label: 'Email', value: student.email },
    { icon: MapPin, label: 'Address', value: student.address },
    { icon: Shield, label: 'Category', value: student.category ? student.category.toUpperCase() : null },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/students')}
        className="btn-ghost gap-2 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Profile Header Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg shadow-indigo-200">
            {getInitials(student.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono">{student.roll_number}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/payments/new?student_id=${student.id}`}
              className="btn-primary gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </Link>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Details */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guardian Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Guardian Name</p>
                <p className="text-sm font-medium text-gray-900">{student.guardian_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Guardian Phone</p>
                <p className="text-sm font-medium text-gray-900">{student.guardian_phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'fees' && (
            <div>
              {fees.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No Fees Assigned"
                  description="This student doesn't have any fee structures assigned yet."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fees.map((fee, idx) => {
                    const total = fee.total_amount || fee.total || 0;
                    const paid = fee.paid_amount || fee.paid || 0;
                    const balance = fee.balance_amount || fee.balance || total - paid;
                    const status = fee.status || (balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid');
                    const progressPercent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

                    return (
                      <div key={fee.id || idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {fee.fee_head || fee.description || fee.name || `Fee ${idx + 1}`}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFeeStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Total</span>
                            <span className="font-medium text-gray-900">{formatCurrency(total)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Paid</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(paid)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Balance</span>
                            <span className="font-medium text-red-600">{formatCurrency(balance)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              {payments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No Payments Yet"
                  description="No payments have been recorded for this student."
                  actionLabel="Record Payment"
                  onAction={() => navigate(`/payments/new?student_id=${student.id}`)}
                />
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt #</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-mono text-gray-900">
                            {payment.receipt_number || '—'}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-gray-600">
                            {formatDate(payment.payment_date || payment.date || payment.created_at)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getPaymentModeLabel(payment.payment_mode || payment.mode)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => handleDownloadReceipt(payment.id)}
                              disabled={downloadingReceipt === payment.id}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors disabled:opacity-50"
                              title="Download Receipt"
                            >
                              {downloadingReceipt === payment.id ? (
                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'scholarships' && (
            <div>
              {scholarships.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Scholarships"
                  description="This student doesn't have any scholarships recorded."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scholarships.map((s, idx) => (
                    <div key={s.id || idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{s.name}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Provider: <span className="font-medium text-gray-900">{s.provider}</span></p>
                        <p className="text-xs text-gray-500">Amount: <span className="font-medium text-emerald-600">{formatCurrency(s.amount)}</span></p>
                        <p className="text-xs text-gray-500">Year: <span className="font-medium text-gray-900">{s.academic_year}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
