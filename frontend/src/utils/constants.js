export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  CLERK: 'clerk',
  AUDITOR: 'auditor',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  accountant: 'Accountant',
  clerk: 'Clerk',
  auditor: 'Auditor',
};

export const ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-purple-100 text-purple-800',
  accountant: 'bg-blue-100 text-blue-800',
  clerk: 'bg-green-100 text-green-800',
  auditor: 'bg-amber-100 text-amber-800',
};

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'neft', label: 'NEFT/RTGS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'dd', label: 'Demand Draft' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'online', label: 'Online Transfer' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'salary', label: 'Salary & Wages' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water Supply' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transport', label: 'Transport' },
  { value: 'events', label: 'Events & Functions' },
  { value: 'library', label: 'Library' },
  { value: 'lab', label: 'Lab Supplies' },
  { value: 'internet', label: 'Internet & IT' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

export const FEE_HEADS = [
  { value: 'tuition', label: 'Tuition Fee' },
  { value: 'admission', label: 'Admission Fee' },
  { value: 'exam', label: 'Examination Fee' },
  { value: 'lab', label: 'Lab Fee' },
  { value: 'library', label: 'Library Fee' },
  { value: 'sports', label: 'Sports Fee' },
  { value: 'development', label: 'Development Fee' },
  { value: 'hostel', label: 'Hostel Fee' },
  { value: 'transport', label: 'Transport Fee' },
  { value: 'caution_deposit', label: 'Caution Deposit' },
  { value: 'placement', label: 'Placement Fee' },
  { value: 'magazine', label: 'Magazine Fee' },
  { value: 'other', label: 'Other Charges' },
];

export const STUDENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'dropped', label: 'Dropped Out' },
];

export const STUDENT_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' },
  { value: 'minority', label: 'Minority' },
];

export const SEMESTERS = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' },
  { value: 3, label: 'Semester 3' },
  { value: 4, label: 'Semester 4' },
  { value: 5, label: 'Semester 5' },
  { value: 6, label: 'Semester 6' },
  { value: 7, label: 'Semester 7' },
  { value: 8, label: 'Semester 8' },
];

export const REPORT_TYPES = [
  { value: 'daily_collection', label: 'Daily Collection', description: 'Day-wise collection summary' },
  { value: 'monthly_collection', label: 'Monthly Collection', description: 'Month-wise collection summary' },
  { value: 'student_dues', label: 'Student Dues', description: 'Students with pending dues' },
  { value: 'course_wise', label: 'Course-wise Collection', description: 'Collection grouped by course' },
  { value: 'payment_mode', label: 'Payment Mode', description: 'Collection by payment mode' },
  { value: 'expense', label: 'Expense Report', description: 'Category-wise expense summary' },
  { value: 'scholarship', label: 'Scholarship Report', description: 'Scholarship & concession details' },
  { value: 'profit_loss', label: 'Profit & Loss', description: 'Income vs expense analysis' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_PAGE_SIZE = 25;
