/**
 * Format a number as Indian Rupee currency
 * e.g. 123456.50 → ₹1,23,456.50
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = Number(amount);
  if (isNaN(num)) return '₹0.00';

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

/**
 * Format date as DD MMM YYYY
 * e.g. "2024-01-15" → "15 Jan 2024"
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date as DD MMM YYYY, HH:MM
 * e.g. "2024-01-15T14:30:00" → "15 Jan 2024, 14:30"
 */
export function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const dateStr = formatDate(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${dateStr}, ${hours}:${minutes}`;
}

/**
 * Get initials from a name
 * e.g. "John Doe" → "JD", "Alice" → "AL"
 */
export function getInitials(name) {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get Tailwind classes for a status badge
 */
export function getStatusColor(status) {
  const colors = {
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-600',
    alumni: 'bg-blue-100 text-blue-800',
    suspended: 'bg-red-100 text-red-800',
    dropped: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    partial: 'bg-yellow-100 text-yellow-800',
    unpaid: 'bg-red-100 text-red-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
}

/**
 * Truncate a string and add ellipsis
 */
export function truncate(str, len = 30) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

/**
 * Get a relative time string
 * e.g. "2 hours ago", "3 days ago"
 */
export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(date);
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}
