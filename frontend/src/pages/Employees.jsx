import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Briefcase, Wallet, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees, createEmployee, updateEmployee, getSalaries, createSalary, getClaims, createClaim, updateClaim } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

const emptyEmployeeForm = {
  employee_id: '',
  name: '',
  department: '',
  designation: '',
  basic_salary: '',
  bank_account_details: '',
  status: 'active',
};

const emptySalaryForm = {
  month: '',
  year: new Date().getFullYear(),
  basic_pay: '',
  allowances: 0,
  deductions: 0,
  status: 'paid',
};

const emptyClaimForm = {
  claim_type: '',
  amount: '',
  description: '',
  status: 'pending',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEmployeeForm);
  const [submitting, setSubmitting] = useState(false);
  
  // Payroll / Claims modal state
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [salaryFormOpen, setSalaryFormOpen] = useState(false);
  const [claimFormOpen, setClaimFormOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState(emptySalaryForm);
  const [claimForm, setClaimForm] = useState(emptyClaimForm);
  const [activeTab, setActiveTab] = useState('salaries');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees({ page, page_size: DEFAULT_PAGE_SIZE });
      setEmployees(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyEmployeeForm);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditing(item);
    setForm({
      employee_id: item.employee_id,
      name: item.name,
      department: item.department,
      designation: item.designation,
      basic_salary: item.basic_salary,
      bank_account_details: item.bank_account_details || '',
      status: item.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, basic_salary: Number(form.basic_salary) };
      if (editing) {
        await updateEmployee(editing.id, payload);
        toast.success('Employee updated');
      } else {
        await createEmployee(payload);
        toast.success('Employee added');
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const loadPayrollData = async (employee) => {
    setActiveEmployee(employee);
    setPayrollModalOpen(true);
    setLoadingPayroll(true);
    setActiveTab('salaries');
    setSalaryFormOpen(false);
    setClaimFormOpen(false);
    try {
      const [salRes, claimsRes] = await Promise.all([
        getSalaries(employee.id),
        getClaims(employee.id)
      ]);
      setSalaries(salRes || []);
      setClaims(claimsRes || []);
    } catch (error) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoadingPayroll(false);
    }
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...salaryForm,
        year: Number(salaryForm.year),
        basic_pay: Number(salaryForm.basic_pay),
        allowances: Number(salaryForm.allowances),
        deductions: Number(salaryForm.deductions)
      };
      await createSalary(activeEmployee.id, payload);
      toast.success('Salary generated');
      setSalaryFormOpen(false);
      const salRes = await getSalaries(activeEmployee.id);
      setSalaries(salRes || []);
    } catch (error) {
      toast.error('Failed to generate salary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...claimForm, amount: Number(claimForm.amount) };
      await createClaim(activeEmployee.id, payload);
      toast.success('Claim added');
      setClaimFormOpen(false);
      const claimsRes = await getClaims(activeEmployee.id);
      setClaims(claimsRes || []);
    } catch (error) {
      toast.error('Failed to add claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    try {
      await updateClaim(claimId, { status: 'approved' });
      toast.success('Claim approved');
      const claimsRes = await getClaims(activeEmployee.id);
      setClaims(claimsRes || []);
    } catch (error) {
      toast.error('Failed to approve claim');
    }
  };

  const columns = [
    {
      key: 'employee_id',
      label: 'Employee ID',
      render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div>
          <span className="text-sm font-semibold text-gray-900 block">{val}</span>
          <span className="text-xs text-gray-500">{row.designation}</span>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (val) => <span className="text-sm text-gray-700">{val}</span>,
    },
    {
      key: 'basic_salary',
      label: 'Basic Salary',
      render: (val) => <span className="text-sm text-gray-700">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
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
            onClick={() => loadPayrollData(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Payroll & Claims"
          >
            <Wallet className="w-4 h-4" />
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
          <h1 className="page-header">Employees & Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff, salaries, and claims</p>
        </div>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No employees found"
        emptyIcon={<Briefcase className="w-12 h-12" />}
      />

      {/* Main Employee Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Employee ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Department <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Designation <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Basic Salary <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.basic_salary}
                  onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Bank Account Details</label>
              <textarea
                value={form.bank_account_details}
                onChange={(e) => setForm({ ...form, bank_account_details: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Account No, Bank Name, IFSC"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payroll Modal */}
      <Modal
        isOpen={payrollModalOpen}
        onClose={() => setPayrollModalOpen(false)}
        title={`Payroll & Claims - ${activeEmployee?.name}`}
        size="xl"
      >
        <div className="flex border-b border-gray-100 mb-4">
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'salaries' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            Salary History
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'claims' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            Claims & Reimbursements
          </button>
        </div>

        {activeTab === 'salaries' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Salaries</h3>
              <button 
                onClick={() => {
                  setSalaryForm({ ...emptySalaryForm, basic_pay: activeEmployee?.basic_salary });
                  setSalaryFormOpen(true);
                }} 
                className="btn-primary text-xs py-1.5"
              >
                Generate Salary
              </button>
            </div>
            
            {salaryFormOpen && (
              <form onSubmit={handleSalarySubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Month</label>
                  <select required value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})} className="select-field py-1 text-sm">
                    <option value="">Select Month</option>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Year</label>
                  <input type="number" required value={salaryForm.year} onChange={e => setSalaryForm({...salaryForm, year: e.target.value})} className="input-field py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Basic Pay</label>
                  <input type="number" required value={salaryForm.basic_pay} onChange={e => setSalaryForm({...salaryForm, basic_pay: e.target.value})} className="input-field py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Allowances</label>
                  <input type="number" value={salaryForm.allowances} onChange={e => setSalaryForm({...salaryForm, allowances: e.target.value})} className="input-field py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Deductions</label>
                  <input type="number" value={salaryForm.deductions} onChange={e => setSalaryForm({...salaryForm, deductions: e.target.value})} className="input-field py-1 text-sm" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 flex-1">Save</button>
                  <button type="button" onClick={() => setSalaryFormOpen(false)} className="btn-secondary text-xs py-2 flex-1">Cancel</button>
                </div>
              </form>
            )}

            {loadingPayroll ? (
              <div className="text-center py-4 text-gray-500 text-sm">Loading salaries...</div>
            ) : salaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">No salary records found</div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {salaries.map(s => (
                  <div key={s.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{s.month} {s.year}</p>
                      <p className="text-xs text-gray-500">Net Pay: <span className="font-medium text-emerald-600">{formatCurrency(s.net_pay)}</span></p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Claims</h3>
              <button onClick={() => setClaimFormOpen(true)} className="btn-primary text-xs py-1.5">
                New Claim
              </button>
            </div>

            {claimFormOpen && (
              <form onSubmit={handleClaimSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Claim Type</label>
                  <input type="text" required placeholder="e.g. Travel, Medical" value={claimForm.claim_type} onChange={e => setClaimForm({...claimForm, claim_type: e.target.value})} className="input-field py-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Amount</label>
                  <input type="number" required min="0" value={claimForm.amount} onChange={e => setClaimForm({...claimForm, amount: e.target.value})} className="input-field py-1 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Description</label>
                  <textarea required value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})} className="input-field py-1 text-sm" rows={2} />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setClaimFormOpen(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary text-xs py-1.5 px-3">Save Claim</button>
                </div>
              </form>
            )}

            {loadingPayroll ? (
              <div className="text-center py-4 text-gray-500 text-sm">Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">No claims found</div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {claims.map(c => (
                  <div key={c.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{c.claim_type} - {formatCurrency(c.amount)}</p>
                      <p className="text-xs text-gray-500">{c.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                      {c.status === 'pending' && (
                        <button onClick={() => handleApproveClaim(c.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
