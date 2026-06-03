import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  total = 0,
  page = 1,
  pageSize = 25,
  onPageChange,
  onSearch,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  searchPlaceholder = 'Search...',
  showSearch = true,
  headerActions,
  onSort,
  sortField,
  sortDirection,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSort, setLocalSort] = useState({ field: null, direction: 'asc' });

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSort = (columnKey) => {
    if (onSort) {
      const newDirection =
        sortField === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newDirection);
    } else {
      setLocalSort((prev) => ({
        field: columnKey,
        direction: prev.field === columnKey && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    }
  };

  const currentSortField = sortField || localSort.field;
  const currentSortDirection = sortDirection || localSort.direction;

  // Client-side sort if no server sort handler
  const sortedData = useMemo(() => {
    if (onSort || !localSort.field) return data;
    return [...data].sort((a, b) => {
      const aVal = a[localSort.field];
      const bVal = b[localSort.field];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const result = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return localSort.direction === 'asc' ? result : -result;
    });
  }, [data, localSort, onSort]);

  const displayData = onSort ? data : sortedData;

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Skeleton rows
  const renderSkeleton = () => {
    return Array.from({ length: 5 }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {columns.map((col, colIdx) => (
          <td key={colIdx} className="px-4 py-3.5">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header with search and actions */}
      {(showSearch || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-100">
          {showSearch && (
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="input-field pl-10 py-2"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                    ${col.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''}
                    ${col.className || ''}
                  `}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable !== false && currentSortField === col.key && (
                      currentSortDirection === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-primary-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              renderSkeleton()
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon && <div className="text-gray-300">{emptyIcon}</div>}
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-sm text-gray-700 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {(page - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-gray-700">
              {Math.min(page * pageSize, total)}
            </span>{' '}
            of <span className="font-medium text-gray-700">{total}</span> results
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors
                  ${
                    pageNum === page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'hover:bg-gray-200 text-gray-600'
                  }
                `}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
