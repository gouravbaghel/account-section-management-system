import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Search, CreditCard, CheckCircle, Download, RotateCcw,
  User, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStudents } from '../api/students';
import { getStudentFees } from '../api/fees';
import { createPayment, getReceiptPdf } from '../api/payments';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, getInitials } from '../utils/formatters';
import { PAYMENT_MODES } from '../utils/constants';

const STEPS = [
  { num: 1, label: 'Select Student' },
  { num: 2, label: 'Select Fee' },
  { num: 3, label: 'Payment Details' },
  { num: 4, label: 'Confirm & Submit' },
];

const emptyPaymentForm = {
  amount: '',
  payment_mode: 'cash',
  transaction_id: '',
  cheque_number: '',
  payment_date: new Date().toISOString().split('T')[0],
  late_fine: '',
  discount: '',
  remarks: '',
};

export default function RecordPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');

  const [step, setStep] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [form, setForm] = useState(emptyPaymentForm);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Pre-select student if ID provided
  useEffect(() => {
    if (preselectedStudentId) {
      const loadStudent = async () => {
        setSearchLoading(true);
        try {
          const res = await getStudents({ search: preselectedStudentId, page_size: 10 });
          const students = res.items || res.data || res.students || res || [];
          const found = students.find((s) => String(s.id) === String(preselectedStudentId));
          if (found) {
            setSelectedStudent(found);
            setStep(2);
          } else if (students.length > 0) {
            setSelectedStudent(students[0]);
            setStep(2);
          }
        } catch (error) {
          console.error('Failed to load pre-selected student:', error);
        } finally {
          setSearchLoading(false);
        }
      };
      loadStudent();
    }
  }, [preselectedStudentId]);

  // Load fees when student is selected
  useEffect(() => {
    if (selectedStudent && step === 2) {
      loadFees();
    }
  }, [selectedStudent, step]);

  const loadFees = async () => {
    if (!selectedStudent) return;
    setFeesLoading(true);
    try {
      const res = await getStudentFees(selectedStudent.id);
      const feeList = res.items || res.data || res.fees || res || [];
      setFees(Array.isArray(feeList) ? feeList : []);
    } catch (error) {
      toast.error('Failed to load student fees');
      setFees([]);
    } finally {
      setFeesLoading(false);
    }
  };

  const handleStudentSearch = async () => {
    if (!studentSearch.trim()) return;
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const res = await getStudents({ search: studentSearch.trim(), page_size: 20 });
      setStudentResults(res.items || res.data || res.students || res || []);
    } catch (error) {
      toast.error('Failed to search students');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStudentSearch();
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStep(2);
    setSelectedFee(null);
    setForm(emptyPaymentForm);
  };

  const selectFee = (fee) => {
    setSelectedFee(fee);
    const balance = fee.balance_amount || fee.balance || ((fee.total_amount || fee.total || 0) - (fee.paid_amount || fee.paid || 0));
    setForm({
      ...emptyPaymentForm,
      amount: balance > 0 ? String(balance) : '',
    });
    setStep(3);
  };

  const computedBalance = useMemo(() => {
    if (!selectedFee) return 0;
    const total = selectedFee.total_amount || selectedFee.total || 0;
    const paid = selectedFee.paid_amount || selectedFee.paid || 0;
    return total - paid;
  }, [selectedFee]);

  const computedPayable = useMemo(() => {
    const amount = Number(form.amount) || 0;
    const fine = Number(form.late_fine) || 0;
    const discount = Number(form.discount) || 0;
    return amount + fine - discount;
  }, [form.amount, form.late_fine, form.discount]);

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedFee) return;
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (form.payment_mode === 'cheque' && !form.cheque_number.trim()) {
      toast.error('Cheque number is required for cheque payments');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        student_id: selectedStudent.id,
        student_fee_id: selectedFee.id,
        amount: Number(form.amount),
        payment_mode: form.payment_mode,
        payment_date: form.payment_date,
        transaction_id: form.transaction_id || undefined,
        cheque_number: form.cheque_number || undefined,
        late_fine: Number(form.late_fine) || 0,
        discount: Number(form.discount) || 0,
        remarks: form.remarks || undefined,
      };
      const result = await createPayment(payload);
      const paymentData = result.data || result.payment || result;
      setSuccessData(paymentData);
      toast.success('Payment recorded successfully!');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to record payment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!successData?.id) return;
    setDownloadingReceipt(true);
    try {
      const blob = await getReceiptPdf(successData.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setStudentSearch('');
    setStudentResults([]);
    setSelectedStudent(null);
    setFees([]);
    setSelectedFee(null);
    setForm(emptyPaymentForm);
    setSuccessData(null);
    setHasSearched(false);
  };

  // Success State
  if (successData) {
    return (
      <div className="space-y-6">
        <div className="max-w-lg mx-auto">
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-6">The payment has been recorded and a receipt has been generated.</p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-left mb-6 border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Receipt Number</span>
                <span className="font-mono font-semibold text-gray-900">{successData.receipt_number || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Student</span>
                <span className="font-medium text-gray-900">{selectedStudent?.name || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(successData.amount || form.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900">{formatDate(successData.payment_date || form.payment_date)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleDownloadReceipt}
                disabled={downloadingReceipt}
                className="btn-primary gap-2 w-full sm:w-auto"
              >
                {downloadingReceipt ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </>
                )}
              </button>
              <button onClick={resetAll} className="btn-secondary gap-2 w-full sm:w-auto">
                <RotateCcw className="w-4 h-4" />
                Record Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/payments')} className="btn-ghost gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1 className="page-header">Record Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Follow the steps to record a new payment</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="card">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.num
                      ? 'bg-emerald-500 text-white'
                      : step === s.num
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    step >= s.num ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all ${
                  step > s.num ? 'bg-emerald-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto">
        {/* Step 1: Search Student */}
        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Search Student</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-field pl-10"
                  placeholder="Search by name, roll number, or admission number..."
                  autoFocus
                />
              </div>
              <button
                onClick={handleStudentSearch}
                disabled={searchLoading || !studentSearch.trim()}
                className="btn-primary gap-2"
              >
                {searchLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>

            {searchLoading && <LoadingSpinner size="lg" className="py-8" />}

            {!searchLoading && hasSearched && studentResults.length === 0 && (
              <EmptyState
                icon={User}
                title="No Students Found"
                description="Try a different search term."
              />
            )}

            {!searchLoading && studentResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{studentResults.length} result(s) found</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {studentResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {getInitials(student.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          Roll: {student.roll_number || '—'} • {student.course_name || student.course?.name || '—'}
                          {student.branch && ` • ${student.branch}`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Fee */}
        {step === 2 && (
          <div className="card space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Select Fee to Pay</h2>
              <button onClick={() => setStep(1)} className="btn-ghost text-sm gap-1">
                <ArrowLeft className="w-4 h-4" />
                Change Student
              </button>
            </div>

            {/* Selected Student Card */}
            {selectedStudent && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(selectedStudent.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">{selectedStudent.name}</p>
                  <p className="text-xs text-indigo-600">
                    {selectedStudent.roll_number} • {selectedStudent.course_name || selectedStudent.course?.name || '—'}
                  </p>
                </div>
              </div>
            )}

            {feesLoading && <LoadingSpinner size="lg" className="py-8" />}

            {!feesLoading && fees.length === 0 && (
              <EmptyState
                icon={CreditCard}
                title="No Pending Fees"
                description="This student has no pending fee records."
              />
            )}

            {!feesLoading && fees.length > 0 && (
              <div className="space-y-3">
                {fees.map((fee, idx) => {
                  const total = fee.total_amount || fee.total || 0;
                  const paid = fee.paid_amount || fee.paid || 0;
                  const balance = fee.balance_amount || fee.balance || (total - paid);
                  const isPaid = balance <= 0;

                  return (
                    <button
                      key={fee.id || idx}
                      onClick={() => !isPaid && selectFee(fee)}
                      disabled={isPaid}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        isPaid
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isPaid ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                        {isPaid ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {fee.fee_head || fee.description || fee.name || `Fee ${idx + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: {formatCurrency(total)} • Paid: {formatCurrency(paid)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Paid
                          </span>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-red-600">{formatCurrency(balance)}</p>
                            <p className="text-xs text-gray-500">Balance</p>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment Form */}
        {step === 3 && (
          <div className="card space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
              <button onClick={() => setStep(2)} className="btn-ghost text-sm gap-1">
                <ArrowLeft className="w-4 h-4" />
                Change Fee
              </button>
            </div>

            {/* Fee summary */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Fee</span>
                <span className="font-medium text-gray-900">
                  {selectedFee?.fee_head || selectedFee?.description || selectedFee?.name || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Outstanding Balance</span>
                <span className="font-bold text-red-600">{formatCurrency(computedBalance)}</span>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
              <div>
                <label className="label-field">Payment Mode <span className="text-red-500">*</span></label>
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
                <label className="label-field">Payment Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field">Transaction ID</label>
                <input
                  type="text"
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              {form.payment_mode === 'cheque' && (
                <div>
                  <label className="label-field">Cheque Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.cheque_number}
                    onChange={(e) => setForm({ ...form, cheque_number: e.target.value })}
                    className="input-field"
                    placeholder="Enter cheque number"
                  />
                </div>
              )}
              <div>
                <label className="label-field">Late Fine</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.late_fine}
                    onChange={(e) => setForm({ ...form, late_fine: e.target.value })}
                    className="input-field pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Discount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="input-field pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            {/* Computed payable */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Amount</span>
                <span className="text-gray-900">{formatCurrency(Number(form.amount) || 0)}</span>
              </div>
              {Number(form.late_fine) > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">+ Late Fine</span>
                  <span className="text-red-600">+{formatCurrency(Number(form.late_fine))}</span>
                </div>
              )}
              {Number(form.discount) > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">- Discount</span>
                  <span className="text-emerald-600">-{formatCurrency(Number(form.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-indigo-200 mt-2">
                <span className="text-indigo-900">Total Payable</span>
                <span className="text-indigo-700">{formatCurrency(computedPayable)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setStep(2)} className="btn-secondary gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => {
                  if (!form.amount || Number(form.amount) <= 0) {
                    toast.error('Please enter a valid amount');
                    return;
                  }
                  if (form.payment_mode === 'cheque' && !form.cheque_number.trim()) {
                    toast.error('Cheque number is required');
                    return;
                  }
                  setStep(4);
                }}
                className="btn-primary gap-2"
              >
                Review
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Payment</h2>
            <p className="text-sm text-gray-500">Please review the details below before submitting.</p>

            <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
              <div className="pb-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Student</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(selectedStudent?.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedStudent?.name}</p>
                    <p className="text-xs text-gray-500">{selectedStudent?.roll_number}</p>
                  </div>
                </div>
              </div>

              <div className="pb-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fee Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fee Head</span>
                    <span className="text-gray-900">{selectedFee?.fee_head || selectedFee?.description || selectedFee?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Outstanding</span>
                    <span className="text-gray-900">{formatCurrency(computedBalance)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="text-gray-900">{formatCurrency(Number(form.amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mode</span>
                    <span className="text-gray-900">{PAYMENT_MODES.find(m => m.value === form.payment_mode)?.label || form.payment_mode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="text-gray-900">{formatDate(form.payment_date)}</span>
                  </div>
                  {form.transaction_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-gray-900">{form.transaction_id}</span>
                    </div>
                  )}
                  {form.cheque_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cheque No.</span>
                      <span className="font-mono text-gray-900">{form.cheque_number}</span>
                    </div>
                  )}
                  {Number(form.late_fine) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Late Fine</span>
                      <span className="text-red-600">+{formatCurrency(Number(form.late_fine))}</span>
                    </div>
                  )}
                  {Number(form.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-emerald-600">-{formatCurrency(Number(form.discount))}</span>
                    </div>
                  )}
                  {form.remarks && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Remarks</span>
                      <span className="text-gray-900 max-w-[60%] text-right">{form.remarks}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-900">Total Payable</span>
                  <span className="text-lg font-bold text-indigo-700">{formatCurrency(computedPayable)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setStep(3)} className="btn-secondary gap-2" disabled={submitting}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button onClick={handleSubmit} className="btn-primary gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
