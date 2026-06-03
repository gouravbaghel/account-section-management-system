import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getDashboardCharts } from '../api/dashboard';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { GraduationCap, IndianRupee, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9', '#4f46e5', '#7c3aed'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-600 mt-1">
            {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, chartsData] = await Promise.all([
        getDashboardStats(),
        getDashboardCharts(),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="page-header">
            {greeting()}, {user?.full_name?.split(' ')[0] || user?.username} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your college finances today.
          </p>
        </div>
        <p className="text-sm text-gray-400">{formatDate(new Date())}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={GraduationCap}
          title="Total Students"
          value={loading ? '...' : (stats?.total_students?.toLocaleString() || '0')}
          trend="up"
          trendValue={stats?.student_growth}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={IndianRupee}
          title="Total Collected"
          value={loading ? '...' : formatCurrency(stats?.total_collected || 0)}
          trend="up"
          trendValue={stats?.collection_growth}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          title="Pending Dues"
          value={loading ? '...' : formatCurrency(stats?.pending_dues || 0)}
          trend="down"
          trendValue={stats?.dues_change}
          color="amber"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          title="Today's Collection"
          value={loading ? '...' : formatCurrency(stats?.today_collection || 0)}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Monthly collection chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Monthly Collection</h2>
            <p className="text-sm text-gray-500">Revenue overview for the past 12 months</p>
          </div>
        </div>
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={charts?.monthly_collections || []}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar
                dataKey="amount"
                name="Collection"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <Link
              to="/payments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(charts?.recent_payments || []).slice(0, 8).map((payment, idx) => (
                <div
                  key={payment.id || idx}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                    {payment.student_name?.charAt(0) || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.student_name || 'Student'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.receipt_number} • {formatDate(payment.date || payment.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}

              {(!charts?.recent_payments || charts.recent_payments.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">No recent payments</p>
              )}
            </div>
          )}
        </div>

        {/* Top dues */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Pending Dues</h2>
            <Link
              to="/students"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(charts?.top_dues || []).slice(0, 8).map((student, idx) => (
                <Link
                  key={student.id || idx}
                  to={`/students/${student.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">
                    {student.name?.charAt(0) || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student.name || 'Student'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {student.roll_number} • {student.course || 'N/A'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">
                    {formatCurrency(student.due_amount || student.pending_amount)}
                  </span>
                </Link>
              ))}

              {(!charts?.top_dues || charts.top_dues.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">No pending dues</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expense by category pie chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Expenses by Category</h2>
            <p className="text-sm text-gray-500">Distribution of expenses across categories</p>
          </div>
        </div>
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : charts?.expense_by_category && charts.expense_by_category.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.expense_by_category}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="amount"
                nameKey="category"
              >
                {charts.expense_by_category.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #f3f4f6',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 capitalize">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 text-center py-16">No expense data available</p>
        )}
      </div>
    </div>
  );
}
