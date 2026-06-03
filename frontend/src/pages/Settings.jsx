import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/settings';
import LoadingSpinner from '../components/LoadingSpinner';
import { version } from '../../package.json';

export default function Settings() {
  const [form, setForm] = useState({
    college_name: '',
    address: '',
    phone: '',
    email: '',
    academic_year: '',
    receipt_prefix: '',
    late_fee_type: 'daily',
    late_fee_amount: 20.0,
    late_fee_slabs: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setForm({
          college_name: data.college_name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          academic_year: data.academic_year || '',
          receipt_prefix: data.receipt_prefix || '',
          late_fee_type: data.late_fee_type || 'daily',
          late_fee_amount: data.late_fee_amount || 20.0,
          late_fee_slabs: data.late_fee_slabs || '',
        });
      } catch (error) {
        toast.error('Failed to load settings');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.college_name.trim()) {
      toast.error('College name is required');
      return;
    }
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Settings updated successfully');
    } catch (error) {
      const msg = error?.response?.data?.detail || 'Failed to update settings';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="page-header">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure college and system settings</p>
        </div>
      </div>

      {/* College Information */}
      <form onSubmit={handleSubmit}>
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">College Information</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">This information appears on receipts and reports</p>
          </div>

          <div className="p-6 space-y-5">
            {/* College Name */}
            <div>
              <label className="label-field">
                College Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.college_name}
                onChange={(e) => setForm({ ...form, college_name: e.target.value })}
                className="input-field"
                placeholder="e.g. National Institute of Technology"
              />
            </div>

            {/* Address */}
            <div>
              <label className="label-field">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field resize-none"
                rows={2}
                placeholder="Full postal address"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="+91-XX-XXXX-XXXX"
                />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="accounts@college.edu.in"
                />
              </div>
            </div>

            {/* Academic Year & Receipt Prefix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Academic Year</label>
                <input
                  type="text"
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 2025-2026"
                />
                <p className="text-xs text-gray-400 mt-1">Format: YYYY-YYYY</p>
              </div>
              <div>
                <label className="label-field">Receipt Prefix</label>
                <input
                  type="text"
                  value={form.receipt_prefix}
                  onChange={(e) => setForm({ ...form, receipt_prefix: e.target.value })}
                  className="input-field"
                  placeholder="e.g. NIT"
                />
                <p className="text-xs text-gray-400 mt-1">Used in receipt numbers like NIT-2025-00001</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-b border-gray-100 bg-gray-50/50 mt-4">
            <h2 className="text-sm font-semibold text-gray-700">Late Fee Configuration</h2>
            <p className="text-xs text-gray-500 mt-0.5">Automated late fee calculation engine settings</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Late Fee Type</label>
                <select
                  value={form.late_fee_type}
                  onChange={(e) => setForm({ ...form, late_fee_type: e.target.value })}
                  className="input-field"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="slab">Slab-based</option>
                </select>
              </div>
              <div>
                <label className="label-field">Late Fee Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.late_fee_amount}
                  onChange={(e) => setForm({ ...form, late_fee_amount: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 20.00"
                />
                <p className="text-xs text-gray-400 mt-1">Amount per day/week (if daily/weekly)</p>
              </div>
            </div>
            
            {form.late_fee_type === 'slab' && (
              <div>
                <label className="label-field">Late Fee Slabs (JSON)</label>
                <textarea
                  value={form.late_fee_slabs}
                  onChange={(e) => setForm({ ...form, late_fee_slabs: e.target.value })}
                  className="input-field font-mono text-sm"
                  rows={4}
                  placeholder='[{"days": 7, "amount": 100}, {"days": 14, "amount": 250}, {"days": -1, "amount": 500}]'
                />
                <p className="text-xs text-gray-400 mt-1">Use -1 for days to represent 'above all others'</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* System Information */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-700">System Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Version</span>
              <p className="font-medium text-gray-900 mt-0.5">{version}</p>
            </div>
            <div>
              <span className="text-gray-500">Backend</span>
              <p className="font-medium text-gray-900 mt-0.5">FastAPI + PostgreSQL</p>
            </div>
            <div>
              <span className="text-gray-500">Frontend</span>
              <p className="font-medium text-gray-900 mt-0.5">React + Vite + Tailwind CSS</p>
            </div>
            <div>
              <span className="text-gray-500">License</span>
              <p className="font-medium text-gray-900 mt-0.5">MIT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
