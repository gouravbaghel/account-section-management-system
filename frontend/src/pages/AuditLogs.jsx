import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, X, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuditLogs } from '../api/settings';
import DataTable from '../components/DataTable';
import { formatDateTime, capitalize } from '../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

const ACTION_COLORS = {
  LOGIN: 'bg-blue-100 text-blue-800',
  CREATE: 'bg-emerald-100 text-emerald-800',
  UPDATE: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
  CANCEL: 'bg-red-100 text-red-800',
  PAYMENT_CREATED: 'bg-emerald-100 text-emerald-800',
  PAYMENT_CANCELLED: 'bg-red-100 text-red-800',
  STUDENT_CREATED: 'bg-blue-100 text-blue-800',
  STUDENT_UPDATED: 'bg-amber-100 text-amber-800',
  EXPENSE_CREATED: 'bg-teal-100 text-teal-800',
  SETTINGS_UPDATED: 'bg-purple-100 text-purple-800',
};

function getActionColor(action) {
  if (!action) return 'bg-gray-100 text-gray-700';
  const upper = action.toUpperCase();
  if (ACTION_COLORS[upper]) return ACTION_COLORS[upper];
  if (upper.includes('CREATE') || upper.includes('ADD')) return 'bg-emerald-100 text-emerald-800';
  if (upper.includes('UPDATE') || upper.includes('EDIT')) return 'bg-amber-100 text-amber-800';
  if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('CANCEL')) return 'bg-red-100 text-red-800';
  if (upper.includes('LOGIN') || upper.includes('AUTH')) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: DEFAULT_PAGE_SIZE };
      if (filterAction) params.action = filterAction;
      if (filterEntity) params.entity_type = filterEntity;
      const res = await getAuditLogs(params);
      setLogs(res.items || res.data || res || []);
      setTotal(res.total || res.count || (Array.isArray(res) ? res.length : 0));
    } catch (error) {
      toast.error('Failed to load audit logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700">{formatDateTime(val)}</span>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      sortable: false,
      render: (_, row) => {
        const name = row.user?.full_name || row.user_name || row.username || `User #${row.user_id || '?'}`;
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-900">{name}</span>
          </div>
        );
      },
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(val)}`}>
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'entity_type',
      label: 'Entity',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm text-gray-600">
          {capitalize(val) || '—'}
          {row.entity_id ? <span className="text-gray-400 ml-1">#{row.entity_id}</span> : ''}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 line-clamp-1 max-w-[200px]">
            {typeof val === 'string' ? val : val ? JSON.stringify(val).slice(0, 60) : '—'}
          </span>
          {val && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}
              className="text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0"
              title="Toggle details"
            >
              {expandedRow === row.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500">Track all system activities and changes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by action..."
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm w-[200px]"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by entity type..."
                value={filterEntity}
                onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm w-[200px]"
              />
            </div>
            {(filterAction || filterEntity) && (
              <button
                onClick={() => { setFilterAction(''); setFilterEntity(''); setPage(1); }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        showSearch={false}
        emptyMessage="No audit logs found"
        emptyIcon={<Shield className="w-12 h-12" />}
      />

      {/* Expanded Detail Rows */}
      {expandedRow && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Log Details — ID #{expandedRow}</h4>
          {(() => {
            const log = logs.find(l => l.id === expandedRow);
            if (!log) return <p className="text-sm text-gray-400">Not found</p>;
            return (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Action:</span>
                    <span className="ml-2 font-medium">{log.action}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Entity:</span>
                    <span className="ml-2 font-medium">{log.entity_type} #{log.entity_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">IP:</span>
                    <span className="ml-2 font-mono text-xs">{log.ip_address || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="ml-2">{formatDateTime(log.created_at)}</span>
                  </div>
                </div>
                {log.user_agent && (
                  <div className="text-xs text-gray-400 font-mono bg-gray-50 rounded p-2 overflow-x-auto">
                    {log.user_agent}
                  </div>
                )}
                {log.details && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">Details:</span>
                    <pre className="mt-1 text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
