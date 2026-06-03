import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRefunds, createRefund, updateRefund } from '../api/refunds';
import { getStudents } from '../api/students';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

const emptyForm = {
  student_id: '',
  amount: '',
  reason: '',
  bank_account_details: '',
  status: 'pending',
};

export default function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRefunds({ page, page_size: DEFAULT_PAGE_SIZE });
      setRefunds(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

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
      amount: item.amount,
      reason: item.reason,
      bank_account_details: item.bank_account_details || '',
      status: item.status,
    });
    setSelectedStudent({ id: item.student_id, name: `Student ID: ${item.student_id}` }); 
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id) {
      toast.error('Please select a student');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) {
        await updateRefund(editing.id, payload);
        toast.success('Refund updated');
      } else {
        await createRefund(payload);
        toast.success('Refund added');
      }
      setModalOpen(false);
      fetchRefunds();
    } catch (error) {
      toast.error('Failed to save refund');
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
      key: 'amount',
      label: 'Amount',
      render: (val) => <span className="text-sm font-semibold text-emerald-600">{formatCurrency(val)}</span>,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => <span className="text-sm text-gray-700 truncate max-w-xs block">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          val === 'completed' ? 'bg-emerald-100 text-emerald-800' :
          val === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-sm text-gray-500">{formatDate(val)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => openEditModal(row)}
          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Refunds</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student fee refunds</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Refund
        </button>
      </div>

      <DataTable
        columns={columns}
        data={refunds}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No refunds found"
        emptyIcon={<RefreshCw className="w-12 h-12" />}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Refund' : 'Add Refund'}
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
              <label className="label-field">Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="input-field pl-7"
                />
              </div>
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
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Reason <span className="text-red-500">*</span></label>
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input-field"
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Bank Account Details</label>
              <textarea
                value={form.bank_account_details}
                onChange={(e) => setForm({ ...form, bank_account_details: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Account number, IFSC, Bank Name"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !selectedStudent}>
              {submitting ? 'Saving...' : 'Save Refund'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
