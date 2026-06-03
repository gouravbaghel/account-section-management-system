import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/settings';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const [form, setForm] = useState({
    college_name: '',
    address: '',
    phone: '',
    email: '',
    academic_year: '',
    receipt_prefix: '',
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure college and system settings</p>
        </div>
      </div>

      {/* College Information */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.college_name}
                onChange={(e) => setForm({ ...form, college_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="e.g. National Institute of Technology"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                rows={2}
                placeholder="Full postal address"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="+91-XX-XXXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="accounts@college.edu.in"
                />
              </div>
            </div>

            {/* Academic Year & Receipt Prefix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="e.g. 2025-2026"
                />
                <p className="text-xs text-gray-400 mt-1">Format: YYYY-YYYY</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Prefix</label>
                <input
                  type="text"
                  value={form.receipt_prefix}
                  onChange={(e) => setForm({ ...form, receipt_prefix: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="e.g. NIT"
                />
                <p className="text-xs text-gray-400 mt-1">Used in receipt numbers like NIT-2025-00001</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-700">System Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Version</span>
              <p className="font-medium text-gray-900 mt-0.5">1.0.0</p>
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
