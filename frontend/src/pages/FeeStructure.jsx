import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Filter, X, DollarSign, Users, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFeeStructures, createFeeStructure, updateFeeStructure, assignFees } from '../api/fees';
import { getCourses } from '../api/courses';
import { getStudents } from '../api/students';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { SEMESTERS, DEFAULT_PAGE_SIZE } from '../utils/constants';

const FEE_FIELDS = [
  { key: 'tuition_fee', label: 'Tuition Fee' },
  { key: 'exam_fee', label: 'Examination Fee' },
  { key: 'library_fee', label: 'Library Fee' },
  { key: 'hostel_fee', label: 'Hostel Fee' },
  { key: 'transport_fee', label: 'Transport Fee' },
  { key: 'lab_fee', label: 'Lab Fee' },
  { key: 'admission_fee', label: 'Admission Fee' },
  { key: 'misc_fee', label: 'Miscellaneous Fee' },
];

const emptyForm = {
  course_id: '',
  semester: '',
  batch: '',
  academic_year: '',
  tuition_fee: '',
  exam_fee: '',
  library_fee: '',
  hostel_fee: '',
  transport_fee: '',
  lab_fee: '',
  admission_fee: '',
  misc_fee: '',
  installment_count: '1',
};

export default function FeeStructure() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchFeeStructures = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: DEFAULT_PAGE_SIZE };
      if (filterCourse) params.course_id = filterCourse;
      if (filterSemester) params.semester = filterSemester;
      if (filterBatch) params.batch = filterBatch;
      if (filterYear) params.academic_year = filterYear;
      const res = await getFeeStructures(params);
      setFeeStructures(res.items || res.data || res.fee_structures || (Array.isArray(res) ? res : []));
      setTotal(res.total || res.count || (Array.isArray(res) ? res.length : 0));
    } catch (error) {
      toast.error('Failed to load fee structures');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filterCourse, filterSemester, filterBatch, filterYear]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await getCourses();
      setCourses(res.data || res.courses || res || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchFeeStructures();
  }, [fetchFeeStructures]);

  const computedTotal = useMemo(() => {
    return FEE_FIELDS.reduce((sum, field) => {
      return sum + (Number(form[field.key]) || 0);
    }, 0);
  }, [form]);

  const validate = () => {
    const errs = {};
    if (!form.course_id) errs.course_id = 'Course is required';
    if (!form.academic_year.trim()) errs.academic_year = 'Academic year is required';
    if (computedTotal <= 0) errs.total = 'Total fee must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (feeStruct) => {
    setEditing(feeStruct);
    setForm({
      course_id: feeStruct.course_id || '',
      semester: feeStruct.semester || '',
      batch: feeStruct.batch || '',
      academic_year: feeStruct.academic_year || '',
      tuition_fee: feeStruct.tuition_fee || '',
      exam_fee: feeStruct.exam_fee || '',
      library_fee: feeStruct.library_fee || '',
      hostel_fee: feeStruct.hostel_fee || '',
      transport_fee: feeStruct.transport_fee || '',
      lab_fee: feeStruct.lab_fee || '',
      admission_fee: feeStruct.admission_fee || '',
      misc_fee: feeStruct.misc_fee || '',
      installment_count: feeStruct.installment_count || '1',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      FEE_FIELDS.forEach((field) => {
        payload[field.key] = Number(payload[field.key]) || 0;
      });
      payload.semester = payload.semester ? Number(payload.semester) : null;
      payload.installment_count = Number(payload.installment_count) || 1;
      payload.total_amount = computedTotal;

      if (editing) {
        await updateFeeStructure(editing.id, payload);
        toast.success('Fee structure updated successfully');
      } else {
        await createFeeStructure(payload);
        toast.success('Fee structure created successfully');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
      fetchFeeStructures();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = async (feeStruct) => {
    setAssignTarget(feeStruct);
    setSelectedStudents([]);
    setStudentSearch('');
    setAssignModalOpen(true);
    setLoadingStudents(true);
    try {
      const params = { page_size: 500 };
      if (feeStruct.course_id) params.course_id = feeStruct.course_id;
      if (feeStruct.semester) params.semester = feeStruct.semester;
      if (feeStruct.batch) params.batch = feeStruct.batch;
      const res = await getStudents(params);
      setStudents(res.data || res.students || res || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setAssigning(true);
    try {
      await assignFees({
        fee_structure_id: assignTarget.id,
        student_ids: selectedStudents,
      });
      toast.success(`Fees assigned to ${selectedStudents.length} student(s)`);
      setAssignModalOpen(false);
      setAssignTarget(null);
      setSelectedStudents([]);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to assign fees';
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleAllStudents = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allSelected = filteredIds.every((id) => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudents((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : '—';
  };

  const columns = [
    {
      key: 'course_id',
      label: 'Course',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.course_name || getCourseName(val)}
        </span>
      ),
    },
    {
      key: 'semester',
      label: 'Semester',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-700">{val || 'All'}</span>,
    },
    {
      key: 'batch',
      label: 'Batch',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-700">{val || 'All'}</span>,
    },
    {
      key: 'academic_year',
      label: 'Year',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-700">{val || '—'}</span>,
    },
    {
      key: 'tuition_fee',
      label: 'Tuition',
      sortable: false,
      render: (val) => <span className="text-sm text-gray-600">{formatCurrency(val || 0)}</span>,
    },
    {
      key: 'exam_fee',
      label: 'Exam',
      sortable: false,
      render: (val) => <span className="text-sm text-gray-600">{formatCurrency(val || 0)}</span>,
    },
    {
      key: 'library_fee',
      label: 'Library',
      sortable: false,
      render: (val) => <span className="text-sm text-gray-600">{formatCurrency(val || 0)}</span>,
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      render: (val, row) => {
        const total = val || FEE_FIELDS.reduce((s, f) => s + (Number(row[f.key]) || 0), 0);
        return <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>;
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
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => openAssignModal(row)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
            title="Assign to Students"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Fee Structure</h1>
          <p className="text-sm text-gray-500 mt-1">Define and manage fee structures for courses</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Fee Structure
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
              value={filterSemester}
              onChange={(e) => { setFilterSemester(e.target.value); setPage(1); }}
              className="select-field max-w-[160px]"
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={filterBatch}
              onChange={(e) => { setFilterBatch(e.target.value); setPage(1); }}
              placeholder="Batch (e.g., 2024)"
              className="input-field max-w-[150px]"
            />
            <input
              type="text"
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
              placeholder="Academic Year"
              className="input-field max-w-[150px]"
            />
            {(filterCourse || filterSemester || filterBatch || filterYear) && (
              <button
                onClick={() => { setFilterCourse(''); setFilterSemester(''); setFilterBatch(''); setFilterYear(''); setPage(1); }}
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
        data={feeStructures}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        showSearch={false}
        emptyMessage="No fee structures found"
        emptyIcon={<DollarSign className="w-12 h-12" />}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setEditing(null); setErrors({}); }}
        title={editing ? 'Edit Fee Structure' : 'Add Fee Structure'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course & Academic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Academic Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Course <span className="text-red-500">*</span></label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="select-field"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.course_id && <p className="text-xs text-red-500 mt-1">{errors.course_id}</p>}
              </div>
              <div>
                <label className="label-field">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="select-field"
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
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
              <div>
                <label className="label-field">Academic Year <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 2024-2025"
                />
                {errors.academic_year && <p className="text-xs text-red-500 mt-1">{errors.academic_year}</p>}
              </div>
            </div>
          </div>

          {/* Fee Heads */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Fee Heads
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="label-field">{field.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="input-field pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            {errors.total && <p className="text-xs text-red-500 mt-2">{errors.total}</p>}
          </div>

          {/* Total & Installments */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Computed Total</span>
              <span className="text-lg font-bold text-indigo-700">{formatCurrency(computedTotal)}</span>
            </div>
            <div>
              <label className="label-field">Number of Installments</label>
              <input
                type="number"
                min="1"
                max="12"
                value={form.installment_count}
                onChange={(e) => setForm({ ...form, installment_count: e.target.value })}
                className="input-field max-w-[120px]"
              />
            </div>
          </div>

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
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                editing ? 'Update Fee Structure' : 'Create Fee Structure'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign to Students Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setAssignTarget(null); setSelectedStudents([]); }}
        title="Assign Fees to Students"
        size="lg"
      >
        <div className="space-y-4">
          {assignTarget && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-sm">
              <p className="font-medium text-indigo-900">
                {assignTarget.course_name || getCourseName(assignTarget.course_id)} — {assignTarget.academic_year}
              </p>
              <p className="text-indigo-600 mt-1">
                Total: {formatCurrency(assignTarget.total_amount || FEE_FIELDS.reduce((s, f) => s + (Number(assignTarget[f.key]) || 0), 0))}
                {assignTarget.semester && ` • Semester ${assignTarget.semester}`}
                {assignTarget.batch && ` • Batch ${assignTarget.batch}`}
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Search students by name or roll number..."
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {loadingStudents ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No matching students found</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id))}
                    onChange={toggleAllStudents}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
                <span className="text-xs text-gray-500">{selectedStudents.length} selected</span>
              </div>

              {/* Student List */}
              <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-2">
                {filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.includes(student.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.roll_number}</p>
                    </div>
                    {selectedStudents.includes(student.id) && (
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setAssignModalOpen(false); setAssignTarget(null); setSelectedStudents([]); }}
              className="btn-secondary"
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              className="btn-primary gap-2"
              disabled={assigning || selectedStudents.length === 0}
            >
              {assigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Assign to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
