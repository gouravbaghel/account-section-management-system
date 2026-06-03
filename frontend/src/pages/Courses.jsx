import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, BookOpen, ChevronDown, ChevronRight, GitBranch, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCourses, createCourse, updateCourse, deleteCourse, getBranches, createBranch } from '../api/courses';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyCourseForm = {
  name: '',
  code: '',
  duration_years: '',
};

const emptyBranchForm = {
  name: '',
  course_id: '',
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCourseForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [branchesMap, setBranchesMap] = useState({});
  const [loadingBranches, setLoadingBranches] = useState(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [branchSubmitting, setBranchSubmitting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCourses();
      setCourses(res.data || res.courses || res || []);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const fetchBranches = async (courseId) => {
    setLoadingBranches(courseId);
    try {
      const res = await getBranches(courseId);
      const branchList = res.data || res.branches || res || [];
      setBranchesMap((prev) => ({ ...prev, [courseId]: branchList }));
    } catch (error) {
      toast.error('Failed to load branches');
    } finally {
      setLoadingBranches(null);
    }
  };

  const toggleExpand = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      if (!branchesMap[courseId]) {
        fetchBranches(courseId);
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Course name is required';
    if (!form.code.trim()) errs.code = 'Course code is required';
    if (!form.duration_years) errs.duration_years = 'Duration is required';
    else if (Number(form.duration_years) < 1 || Number(form.duration_years) > 10) {
      errs.duration_years = 'Duration must be between 1 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyCourseForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditing(course);
    setForm({
      name: course.name || '',
      code: course.code || '',
      duration_years: course.duration_years || '',
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
        duration_years: Number(form.duration_years),
      };
      if (editing) {
        await updateCourse(editing.id, payload);
        toast.success('Course updated successfully');
      } else {
        await createCourse(payload);
        toast.success('Course added successfully');
      }
      setModalOpen(false);
      setForm(emptyCourseForm);
      setEditing(null);
      fetchCourses();
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
      await deleteCourse(deleteTarget.id);
      toast.success('Course deleted successfully');
      setDeleteTarget(null);
      fetchCourses();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to delete course';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toast.error('Branch name is required');
      return;
    }
    setBranchSubmitting(true);
    try {
      await createBranch(branchForm);
      toast.success('Branch added successfully');
      setBranchModalOpen(false);
      setBranchForm(emptyBranchForm);
      fetchBranches(branchForm.course_id);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to add branch';
      toast.error(msg);
    } finally {
      setBranchSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'expand',
      label: '',
      sortable: false,
      width: '40px',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          {expandedCourse === row.id ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
      ),
    },
    {
      key: 'name',
      label: 'Course Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{val}</p>
            <p className="text-xs text-gray-500">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (val) => <span className="font-mono text-sm text-gray-700">{val || '—'}</span>,
    },
    {
      key: 'duration_years',
      label: 'Duration',
      sortable: true,
      render: (val) => (
        <span className="text-sm text-gray-700">
          {val ? `${val} ${val === 1 ? 'Year' : 'Years'}` : '—'}
        </span>
      ),
    },
    {
      key: 'branches_count',
      label: 'Branches',
      sortable: false,
      render: (val, row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {val || row.branches?.length || 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          val === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Active'}
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
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
            title="Edit Course"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Delete Course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setBranchForm({ name: '', course_id: row.id });
              setBranchModalOpen(true);
            }}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
            title="Add Branch"
          >
            <GitBranch className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Custom render for expanded rows: we build the table data with expansion rows interspersed
  const tableData = [];
  courses.forEach((course) => {
    tableData.push(course);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage courses and their branches</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branches</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No courses found</p>
                      <button onClick={openAddModal} className="btn-primary mt-2 text-sm gap-2">
                        <Plus className="w-4 h-4" />
                        Add Course
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <React.Fragment key={course.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleExpand(course.id)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          {expandedCourse === course.id ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">{course.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm text-gray-700">{course.code || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700">
                        {course.duration_years ? `${course.duration_years} ${course.duration_years === 1 ? 'Year' : 'Years'}` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {course.branches_count || course.branches?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                            title="Edit Course"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(course)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setBranchForm({ name: '', course_id: course.id });
                              setBranchModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                            title="Add Branch"
                          >
                            <GitBranch className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded branches */}
                    {expandedCourse === course.id && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50/50 px-4 py-0">
                          <div className="py-4 pl-16">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <GitBranch className="w-3.5 h-3.5" />
                              Branches
                            </h4>
                            {loadingBranches === course.id ? (
                              <LoadingSpinner size="sm" className="py-4" />
                            ) : (branchesMap[course.id] || []).length === 0 ? (
                              <p className="text-sm text-gray-400 italic py-2">No branches added yet</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {(branchesMap[course.id] || []).map((branch, idx) => (
                                  <span
                                    key={branch.id || idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 shadow-sm"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {branch.name || branch.branch_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Course Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyCourseForm); setEditing(null); setErrors({}); }}
        title={editing ? 'Edit Course' : 'Add New Course'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Bachelor of Technology"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label-field">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="input-field"
              placeholder="e.g., BTECH"
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="label-field">
              Duration (Years) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.duration_years}
              onChange={(e) => setForm({ ...form, duration_years: e.target.value })}
              className="input-field"
              placeholder="e.g., 4"
            />
            {errors.duration_years && <p className="text-xs text-red-500 mt-1">{errors.duration_years}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setForm(emptyCourseForm); setEditing(null); setErrors({}); }}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editing ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                editing ? 'Update Course' : 'Add Course'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Branch Modal */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => { setBranchModalOpen(false); setBranchForm(emptyBranchForm); }}
        title="Add Branch"
        size="sm"
      >
        <form onSubmit={handleAddBranch} className="space-y-4">
          <div>
            <label className="label-field">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Computer Science & Engineering"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setBranchModalOpen(false); setBranchForm(emptyBranchForm); }}
              className="btn-secondary"
              disabled={branchSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={branchSubmitting}>
              {branchSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </div>
              ) : (
                'Add Branch'
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
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone. All associated branches will also be removed.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
