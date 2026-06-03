import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye, GraduationCap, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStudents, createStudent, updateStudent } from '../api/students';
import { getCourses, getBranches } from '../api/courses';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getInitials, getStatusColor } from '../utils/formatters';
import { STUDENT_STATUSES, STUDENT_CATEGORIES, SEMESTERS, DEFAULT_PAGE_SIZE } from '../utils/constants';

const emptyForm = {
  name: '',
  roll_number: '',
  admission_number: '',
  course_id: '',
  branch: '',
  semester: '',
  batch: '',
  phone: '',
  email: '',
  address: '',
  guardian_name: '',
  guardian_phone: '',
  category: 'general',
  status: 'active',
};

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: DEFAULT_PAGE_SIZE };
      if (search) params.search = search;
      if (filterCourse) params.course_id = filterCourse;
      if (filterStatus) params.status = filterStatus;
      const res = await getStudents(params);
      setStudents(res.items || res.data || res.students || (Array.isArray(res) ? res : []));
      setTotal(res.total || res.count || (Array.isArray(res) ? res.length : 0));
    } catch (error) {
      toast.error('Failed to load students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCourse, filterStatus]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await getCourses();
      setCourses(res.items || res.data || res.courses || (Array.isArray(res) ? res : []));
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const loadBranches = async () => {
      if (form.course_id) {
        try {
          const res = await getBranches(form.course_id);
          setBranches(res.items || res.data || res.branches || (Array.isArray(res) ? res : []));
        } catch (error) {
          setBranches([]);
        }
      } else {
        setBranches([]);
      }
    };
    loadBranches();
  }, [form.course_id]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.roll_number.trim()) errs.roll_number = 'Roll number is required';
    if (!form.course_id) errs.course_id = 'Course is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address';
    }
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      errs.phone = 'Phone must be 10 digits';
    }
    if (form.guardian_phone && !/^\d{10}$/.test(form.guardian_phone.replace(/\D/g, ''))) {
      errs.guardian_phone = 'Phone must be 10 digits';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditing(student);
    setForm({
      name: student.name || '',
      roll_number: student.roll_number || '',
      admission_number: student.admission_number || '',
      course_id: student.course_id || '',
      branch: student.branch || '',
      semester: student.semester || '',
      batch: student.batch || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      category: student.category || 'general',
      status: student.status || 'active',
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
        semester: form.semester ? Number(form.semester) : null,
      };
      if (editing) {
        await updateStudent(editing.id, payload);
        toast.success('Student updated successfully');
      } else {
        await createStudent(payload);
        toast.success('Student added successfully');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
      fetchStudents();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(row.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roll_number',
      label: 'Roll No',
      sortable: true,
      render: (val) => <span className="font-mono text-sm text-gray-700">{val || '—'}</span>,
    },
    {
      key: 'course_name',
      label: 'Course',
      sortable: true,
      render: (val, row) => <span className="text-sm text-gray-700">{val || row.course?.name || '—'}</span>,
    },
    {
      key: 'branch',
      label: 'Branch',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-600">{val || '—'}</span>,
    },
    {
      key: 'semester',
      label: 'Sem',
      sortable: true,
      render: (val) => val ? <span className="text-sm text-gray-600">{val}</span> : <span className="text-gray-400">—</span>,
    },
    {
      key: 'batch',
      label: 'Batch',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-600">{val || '—'}</span>,
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
            onClick={() => navigate(`/students/${row.id}`)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
            title="Edit Student"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const renderFormField = (label, name, type = 'text', options = null, required = false) => (
    <div>
      <label className="label-field">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="select-field"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="input-field resize-none"
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="input-field"
        />
      )}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Students</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student records and information</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Student
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
            <select
              value={filterCourse}
              onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}
              className="select-field max-w-[200px]"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="select-field max-w-[160px]"
            >
              <option value="">All Statuses</option>
              {STUDENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(filterCourse || filterStatus) && (
              <button
                onClick={() => { setFilterCourse(''); setFilterStatus(''); setPage(1); }}
                className="btn-ghost text-xs gap-1 py-2"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        onSearch={handleSearch}
        loading={loading}
        searchPlaceholder="Search by name, roll number, or email..."
        emptyMessage="No students found"
        emptyIcon={<GraduationCap className="w-12 h-12" />}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); setErrors({}); }}
        title={editing ? 'Edit Student' : 'Add New Student'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Full Name', 'name', 'text', null, true)}
              {renderFormField('Roll Number', 'roll_number', 'text', null, true)}
              {renderFormField('Admission Number', 'admission_number')}
              {renderFormField('Category', 'category', 'text', STUDENT_CATEGORIES)}
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Course', 'course_id', 'text', courses.map(c => ({ value: c.id, label: c.name })), true)}
              {renderFormField('Branch', 'branch', 'text', branches.length > 0 ? branches.map(b => ({ value: b.name || b.branch_name, label: b.name || b.branch_name })) : null)}
              {renderFormField('Semester', 'semester', 'text', SEMESTERS)}
              <div>
                <label className="label-field">Batch</label>
                <input
                  type="text"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 2024-2028"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Phone', 'phone', 'tel')}
              {renderFormField('Email', 'email', 'email')}
              <div className="sm:col-span-2">
                {renderFormField('Address', 'address', 'textarea')}
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFormField('Guardian Name', 'guardian_name')}
              {renderFormField('Guardian Phone', 'guardian_phone', 'tel')}
            </div>
          </div>

          {/* Status */}
          {editing && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                Status
              </h3>
              <div className="max-w-xs">
                {renderFormField('Status', 'status', 'text', STUDENT_STATUSES)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); setErrors({}); }}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {editing ? 'Update Student' : 'Add Student'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
