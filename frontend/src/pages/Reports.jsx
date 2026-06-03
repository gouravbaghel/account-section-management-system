import { useState, useCallback } from 'react';
import {
  FileText, Download, Calendar, BarChart3, Users, CreditCard,
  GraduationCap, PieChart, TrendingUp, IndianRupee, Filter, Loader2, Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getReport, downloadReportCSV } from '../api/reports';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { REPORT_TYPES } from '../utils/constants';

const REPORT_ICONS = {
  daily_collection: Calendar,
  monthly_collection: BarChart3,
  student_dues: Users,
  course_wise: GraduationCap,
  payment_mode: CreditCard,
  expense: PieChart,
  scholarship: IndianRupee,
  profit_loss: TrendingUp,
};

const REPORT_COLORS = {
  daily_collection: 'bg-blue-50 text-blue-600 border-blue-200',
  monthly_collection: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  student_dues: 'bg-amber-50 text-amber-600 border-amber-200',
  course_wise: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  payment_mode: 'bg-purple-50 text-purple-600 border-purple-200',
  expense: 'bg-red-50 text-red-600 border-red-200',
  scholarship: 'bg-teal-50 text-teal-600 border-teal-200',
  profit_loss: 'bg-orange-50 text-orange-600 border-orange-200',
};

const ACTIVE_COLORS = {
  daily_collection: 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300',
  monthly_collection: 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300',
  student_dues: 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300',
  course_wise: 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300',
  payment_mode: 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-300',
  expense: 'bg-red-600 text-white border-red-600 ring-2 ring-red-300',
  scholarship: 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-300',
  profit_loss: 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-300',
};

function getColumnsForReport(type) {
  switch (type) {
    case 'daily_collection':
      return [
        { key: 'date', label: 'Date', render: (v) => <span className="text-sm">{formatDate(v)}</span> },
        { key: 'receipt_number', label: 'Receipt #', render: (v) => <span className="text-sm font-medium text-indigo-600">{v || '—'}</span> },
        { key: 'student_name', label: 'Student', render: (v) => <span className="text-sm">{v || '—'}</span> },
        { key: 'amount', label: 'Amount', render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span> },
        { key: 'payment_mode', label: 'Mode', render: (v) => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{v?.replace(/_/g, ' ') || '—'}</span> },
      ];
    case 'monthly_collection':
      return [
        { key: 'month', label: 'Month', render: (v) => <span className="text-sm">{v || '—'}</span> },
        { key: 'total_payments', label: 'Transactions', render: (v) => <span className="text-sm">{v || 0}</span> },
        { key: 'total_amount', label: 'Total Amount', render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span> },
      ];
    case 'student_dues':
      return [
        { key: 'student_name', label: 'Student', render: (v) => <span className="text-sm font-medium">{v || '—'}</span> },
        { key: 'roll_number', label: 'Roll No', render: (v) => <span className="text-sm">{v || '—'}</span> },
        { key: 'course_name', label: 'Course', render: (v) => <span className="text-sm">{v || '—'}</span> },
        { key: 'total_due', label: 'Total Fee', render: (v) => <span className="text-sm">{formatCurrency(v)}</span> },
        { key: 'total_paid', label: 'Paid', render: (v) => <span className="text-sm text-emerald-700">{formatCurrency(v)}</span> },
        { key: 'balance', label: 'Balance', render: (v) => <span className="text-sm font-semibold text-red-600">{formatCurrency(v)}</span> },
      ];
    case 'course_wise':
      return [
        { key: 'course_name', label: 'Course', render: (v) => <span className="text-sm font-medium">{v || '—'}</span> },
        { key: 'total_payments', label: 'Transactions', render: (v) => <span className="text-sm">{v || 0}</span> },
        { key: 'total_amount', label: 'Total Collected', render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span> },
      ];
    case 'payment_mode':
      return [
        { key: 'payment_mode', label: 'Payment Mode', render: (v) => <span className="text-sm capitalize">{v?.replace(/_/g, ' ') || '—'}</span> },
        { key: 'total_payments', label: 'Transactions', render: (v) => <span className="text-sm">{v || 0}</span> },
        { key: 'total_amount', label: 'Total Amount', render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span> },
      ];
    case 'expense':
      return [
        { key: 'category', label: 'Category', render: (v) => <span className="text-sm capitalize">{v?.replace(/_/g, ' ') || '—'}</span> },
        { key: 'count', label: 'Entries', render: (v) => <span className="text-sm">{v || 0}</span> },
        { key: 'total_amount', label: 'Total Amount', render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span> },
      ];
    case 'scholarship':
      return [
        { key: 'student_name', label: 'Student', render: (v) => <span className="text-sm font-medium">{v || '—'}</span> },
        { key: 'roll_number', label: 'Roll No', render: (v) => <span className="text-sm">{v || '—'}</span> },
        { key: 'scholarship_amount', label: 'Scholarship', render: (v) => <span className="text-sm text-emerald-700">{formatCurrency(v)}</span> },
        { key: 'discount_amount', label: 'Discount', render: (v) => <span className="text-sm text-blue-700">{formatCurrency(v)}</span> },
      ];
    case 'profit_loss':
      return [
        { key: 'label', label: 'Particulars', render: (v) => <span className="text-sm font-medium">{v || '—'}</span> },
        { key: 'amount', label: 'Amount', render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span> },
      ];
    default:
      return [
        { key: 'label', label: 'Item', render: (v) => <span className="text-sm">{v || '—'}</span> },
        { key: 'value', label: 'Value', render: (v) => <span className="text-sm">{v ?? '—'}</span> },
      ];
  }
}

export default function Reports() {
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = useCallback(async () => {
    if (!selectedType) {
      toast.error('Please select a report type');
      return;
    }
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    setLoading(true);
    setReportData(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const data = await getReport(selectedType, params);
      setReportData(data);
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedType, dateFrom, dateTo]);

  const handleExportCSV = async () => {
    if (!selectedType) return;
    setExporting(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const blob = await downloadReportCSV(selectedType, params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getReportItems = () => {
    if (!reportData) return [];
    if (Array.isArray(reportData)) return reportData;
    if (reportData.items) return reportData.items;
    if (reportData.payments) return reportData.payments;
    if (reportData.daily_breakdown) return reportData.daily_breakdown;
    if (reportData.data) return reportData.data;
    // For profit_loss, construct items from breakdown
    if (reportData.income_breakdown || reportData.expense_breakdown) {
      const items = [];
      if (reportData.income_breakdown) {
        items.push({ label: '— INCOME —', amount: '', _header: true });
        reportData.income_breakdown.forEach(i => items.push({ label: i.label || i.category || i.source, amount: i.amount || i.total }));
        items.push({ label: 'Total Income', amount: reportData.total_income });
      }
      if (reportData.expense_breakdown) {
        items.push({ label: '— EXPENSES —', amount: '', _header: true });
        reportData.expense_breakdown.forEach(i => items.push({ label: i.label || i.category, amount: i.amount || i.total }));
        items.push({ label: 'Total Expenses', amount: reportData.total_expenses });
      }
      items.push({ label: 'Net Balance', amount: reportData.net_balance });
      return items;
    }
    return [];
  };

  const getSummaryStats = () => {
    if (!reportData) return [];
    const stats = [];
    if (reportData.total_amount !== undefined) {
      stats.push({ label: 'Total Amount', value: formatCurrency(reportData.total_amount), color: 'text-indigo-600' });
    }
    if (reportData.total_payments !== undefined) {
      stats.push({ label: 'Total Transactions', value: reportData.total_payments, color: 'text-blue-600' });
    }
    if (reportData.total_income !== undefined) {
      stats.push({ label: 'Total Income', value: formatCurrency(reportData.total_income), color: 'text-emerald-600' });
    }
    if (reportData.total_expenses !== undefined) {
      stats.push({ label: 'Total Expenses', value: formatCurrency(reportData.total_expenses), color: 'text-red-600' });
    }
    if (reportData.net_balance !== undefined) {
      stats.push({ label: 'Net Balance', value: formatCurrency(reportData.net_balance), color: reportData.net_balance >= 0 ? 'text-emerald-600' : 'text-red-600' });
    }
    return stats;
  };

  const items = getReportItems();
  const summaryStats = getSummaryStats();
  const columns = selectedType ? getColumnsForReport(selectedType) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export financial reports</p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_TYPES.map((type) => {
          const Icon = REPORT_ICONS[type.value] || FileText;
          const isActive = selectedType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => { setSelectedType(type.value); setReportData(null); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isActive
                  ? ACTIVE_COLORS[type.value]
                  : `${REPORT_COLORS[type.value]} hover:shadow-md hover:-translate-y-0.5`
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters & Actions */}
      {selectedType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={generateReport}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && reportData && (
        <div className="space-y-4 print:space-y-2" id="report-output">
          {/* Summary Stats */}
          {summaryStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {summaryStats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Export / Print buttons */}
          <div className="flex justify-end gap-2 print:hidden">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          {/* Data Table */}
          {items.length > 0 ? (
            <DataTable
              columns={columns}
              data={items}
              total={items.length}
              page={1}
              pageSize={items.length}
              onPageChange={() => {}}
              loading={false}
              showSearch={false}
              emptyMessage="No data found"
              emptyIcon={<FileText className="w-12 h-12" />}
            />
          ) : (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No Data"
              description="No data found for the selected report and filters."
            />
          )}
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !reportData && selectedType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Generate</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Select date range filters and click "Generate" to create your{' '}
            {REPORT_TYPES.find(r => r.value === selectedType)?.label || 'report'}.
          </p>
        </div>
      )}

      {!selectedType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Report Type</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Choose a report type from the cards above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
