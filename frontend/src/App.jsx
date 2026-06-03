import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import { ROLES } from './utils/constants';

// Lazy loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Courses = lazy(() => import('./pages/Courses'));
const FeeStructure = lazy(() => import('./pages/FeeStructure'));
const Payments = lazy(() => import('./pages/Payments'));
const RecordPayment = lazy(() => import('./pages/RecordPayment'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Reports = lazy(() => import('./pages/Reports'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users'));
const Scholarships = lazy(() => import('./pages/Scholarships'));
const Loans = lazy(() => import('./pages/Loans'));
const Refunds = lazy(() => import('./pages/Refunds'));
const NOC = lazy(() => import('./pages/NOC'));
const Employees = lazy(() => import('./pages/Employees'));

// Student Portal
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
import StudentLayout from './components/StudentLayout';
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

const SuspenseLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast />
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          <Route path="/student/login" element={<StudentLogin />} />

          {/* Student Portal Routes */}
          <Route
            path="/student"
            element={
              <StudentLayout />
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route index element={<Navigate to="/student/dashboard" replace />} />
          </Route>

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="courses" element={<Courses />} />
            <Route path="fee-structure" element={<FeeStructure />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/new" element={<RecordPayment />} />
            <Route path="scholarships" element={<Scholarships />} />
            <Route path="loans" element={<Loans />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="noc" element={<NOC />} />
            <Route path="employees" element={<Employees />} />
            <Route path="expenses" element={<Expenses />} />
            <Route
              path="reports"
              element={
                <ProtectedRoute
                  roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.AUDITOR]}
                >
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute
                  roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR]}
                >
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
