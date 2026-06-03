import { TrendingUp, TrendingDown } from 'lucide-react';

const colorVariants = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
  green: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
  violet: {
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
};

export default function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  trendValue,
  color = 'blue',
  loading = false,
}) {
  const variant = colorVariants[color] || colorVariants.blue;

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-32" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trendValue !== undefined && trendValue !== null && (
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' ? (
                <TrendingUp className={`w-4 h-4 ${variant.trendUp}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${variant.trendDown}`} />
              )}
              <span
                className={`text-xs font-medium ${
                  trend === 'up' ? variant.trendUp : variant.trendDown
                }`}
              >
                {trendValue}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${variant.iconBg} 
            group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-6 h-6 ${variant.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
