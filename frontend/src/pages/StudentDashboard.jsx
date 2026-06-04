import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feesRes, paymentsRes] = await Promise.all([
          client.get('/portal/fees'),
          client.get('/portal/payments'),
        ]);
        setFees(feesRes.data);
        setPayments(paymentsRes.data);
      } catch (error) {
        console.error('Error fetching student portal data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalBalance = fees.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Welcome, {user.name}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {user.course_name} • {user.branch} • Semester {user.semester}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-500">Total Outstanding Balance</span>
            <div className="mt-1 text-3xl font-semibold text-red-600">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Fees */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">My Fees</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {fees.map((fee) => (
              <li key={fee.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {fee.academic_year}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                      fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {fee.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Total: {formatCurrency(fee.total_amount)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>Balance: <span className="font-medium text-gray-900">{formatCurrency(fee.balance)}</span></p>
                  </div>
                </div>
              </li>
            ))}
            {fees.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500">No fee records found.</li>
            )}
          </ul>
        </div>

        {/* My Payments */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Payments</h3>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {payments.map((payment) => (
              <li key={payment.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {payment.receipt_number}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {format(new Date(payment.payment_date), 'dd MMM yyyy')} • {payment.payment_mode.toUpperCase()}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-indigo-600 sm:mt-0 hover:text-indigo-900 cursor-pointer">
                    <a href={`${import.meta.env.VITE_API_URL}/api/receipts/${payment.id}/pdf`} target="_blank" rel="noreferrer">
                      Download Receipt
                    </a>
                  </div>
                </div>
              </li>
            ))}
            {payments.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500">No payment records found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
