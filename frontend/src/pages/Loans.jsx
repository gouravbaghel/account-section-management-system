import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Landmark, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLoans, createLoan, updateLoan, getLoanInstallments, createLoanInstallment } from '../api/loans';
import { getStudents } from '../api/students';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

const emptyForm = {
  student_id: '',
  bank_name: '',
  branch: '',
  account_number: '',
  total_amount: '',
  academic_year: '',
  status: 'approved',
  remarks: '',
};

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [viewInstallments, setViewInstallments] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLoans({ page, page_size: DEFAULT_PAGE_SIZE });
      setLoans(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleStudentSearch = async () => {
    if (!studentSearch.trim()) return;
    setSearchingStudents(true);
    try {
      const res = await getStudents({ search: studentSearch.trim(), page_size: 5 });
      setStudentResults(res.items || []);
    } catch (error) {
      toast.error('Failed to search students');
    } finally {
      setSearchingStudents(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setForm({ ...form, student_id: student.id });
    setStudentResults([]);
    setStudentSearch('');
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedStudent(null);
    setStudentSearch('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditing(item);
    setForm({
      student_id: item.student_id,
      bank_name: item.bank_name,
      branch: item.branch || '',
      account_number: item.account_number || '',
      total_amount: item.total_amount,
      academic_year: item.academic_year,
      status: item.status,
      remarks: item.remarks || '',
    });
    setSelectedStudent({ id: item.student_id, name: `Student ID: ${item.student_id}` }); 
    setModalOpen(true);
  };

  const loadInstallments = async (loan) => {
    setViewInstallments(loan);
    setLoadingInstallments(true);
    try {
      const res = await getLoanInstallments(loan.id);
      setInstallments(res || []);
    } catch (error) {
      toast.error('Failed to load installments');
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id) {
      toast.error('Please select a student');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, total_amount: Number(form.total_amount) };
      if (editing) {
        await updateLoan(editing.id, payload);
        toast.success('Loan updated');
      } else {
        await createLoan(payload);
        toast.success('Loan added');
      }
      setModalOpen(false);
      fetchLoans();
    } catch (error) {
      toast.error('Failed to save loan');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'student_id',
      label: 'Student ID',
      render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span>,
    },
    {
      key: 'bank_name',
      label: 'Bank',
      render: (val) => <span className="text-sm text-gray-700">{val}</span>,
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (val) => <span className="text-sm font-semibold text-indigo-600">{formatCurrency(val)}</span>,
    },
    {
      key: 'academic_year',
      label: 'Year',
      render: (val) => <span className="text-sm text-gray-700">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          val === 'approved' ? 'bg-emerald-100 text-emerald-800' :
          val === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => loadInstallments(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="View Installments"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Education Loans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student education loans and installments</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Loan
        </button>
      </div>

      <DataTable
        columns={columns}
        data={loans}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No education loans found"
        emptyIcon={<Landmark className="w-12 h-12" />}
      />

      {/* Main Loan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Loan' : 'Add Loan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && !selectedStudent && (
            <div className="space-y-2">
              <label className="label-field">Search Student <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="input-field"
                  placeholder="Name or Roll No"
                />
                <button
                  type="button"
                  onClick={handleStudentSearch}
                  className="btn-secondary whitespace-nowrap"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
              </div>
              {studentResults.length > 0 && (
                <div className="border border-gray-200 rounded-md mt-2 max-h-40 overflow-y-auto">
                  {studentResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => selectStudent(s)}
                      className="p-2 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0"
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.roll_number}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedStudent && (
            <div className="bg-indigo-50 p-3 rounded-md flex justify-between items-center">
              <div>
                <span className="text-xs text-indigo-600 font-semibold uppercase">Selected Student</span>
                <p className="text-sm font-medium text-indigo-900">{selectedStudent.name}</p>
              </div>
              {!editing && (
                <button type="button" onClick={() => setSelectedStudent(null)} className="text-indigo-600 hover:text-indigo-800 text-sm">
                  Change
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Bank Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Branch</label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Account Number</label>
              <input
                type="text"
                value={form.account_number}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Total Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  className="input-field pl-7"
                />
              </div>
            </div>
            <div>
              <label className="label-field">Academic Year <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                className="input-field"
                placeholder="2024-2025"
              />
            </div>
            <div>
              <label className="label-field">Status <span className="text-red-500">*</span></label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select-field"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !selectedStudent}>
              {submitting ? 'Saving...' : 'Save Loan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Installments Modal */}
      <Modal
        isOpen={!!viewInstallments}
        onClose={() => setViewInstallments(null)}
        title="Loan Installments"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Loan Amount:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(viewInstallments?.total_amount)}</span>
            </div>
          </div>
          
          {loadingInstallments ? (
            <div className="text-center py-4 text-gray-500 text-sm">Loading installments...</div>
          ) : installments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
              No installments recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {installments.map((inst, idx) => (
                <div key={inst.id || idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(inst.amount)}</p>
                    <p className="text-xs text-gray-500">Due: {formatDate(inst.due_date)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    inst.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inst.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
