import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, FileCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNOCRequests, createNOCRequest, updateNOCRequest } from '../api/noc';
import { getStudents } from '../api/students';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

const emptyForm = {
  student_id: '',
  purpose: '',
  status: 'pending',
  remarks: '',
};

export default function NOC() {
  const [nocRequests, setNocRequests] = useState([]);
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

  const fetchNOCRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNOCRequests({ page, page_size: DEFAULT_PAGE_SIZE });
      setNocRequests(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error('Failed to load NOC requests');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNOCRequests();
  }, [fetchNOCRequests]);

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
      purpose: item.purpose,
      status: item.status,
      remarks: item.remarks || '',
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
      if (editing) {
        await updateNOCRequest(editing.id, form);
        toast.success('NOC request updated');
      } else {
        await createNOCRequest(form);
        toast.success('NOC request created');
      }
      setModalOpen(false);
      fetchNOCRequests();
    } catch (error) {
      toast.error('Failed to save NOC request');
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
      key: 'purpose',
      label: 'Purpose',
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
          <h1 className="page-header">NOC Processing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage No Dues / No Objection Certificates</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Request NOC
        </button>
      </div>

      <DataTable
        columns={columns}
        data={nocRequests}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No NOC requests found"
        emptyIcon={<FileCheck className="w-12 h-12" />}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit NOC Request' : 'New NOC Request'}
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label-field">Purpose <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="input-field"
                placeholder="e.g. Higher Studies, Transfer"
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
            <div>
              <label className="label-field">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="input-field"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !selectedStudent}>
              {submitting ? 'Saving...' : 'Save NOC Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
