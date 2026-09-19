import { ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { Checkbox } from './Checkbox';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  className?: string;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const Table = <T,>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyMessage = 'No data available',
  onRowClick,
  selectable,
  selectedKeys = new Set(),
  onSelectionChange,
  className,
  pagination,
}: TableProps<T>) => {
  const isAllSelected = data.length > 0 && data.every(item => selectedKeys.has(keyExtractor(item)));
  const isIndeterminate = data.length > 0 && data.some(item => selectedKeys.has(keyExtractor(item))) && !isAllSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(keyExtractor)));
    }
  };

  const handleSelectRow = (key: string | number) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    onSelectionChange(newSelection);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {selectable && <th className="px-4 py-3"><Checkbox checked={false} indeterminate={false} disabled /></th>}
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && <td className="px-4 py-3"><div className="h-4 w-4 rounded border-gray-300 bg-gray-200" /></td>}
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selectable && (
                <th className="px-4 py-3">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor(item);
                const isSelected = selectedKeys.has(key);
                
                return (
                  <tr
                    key={key}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(key)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className={cn('px-4 py-4 text-sm text-gray-900 dark:text-gray-100', col.className)}>
                        {col.render ? col.render(item, index) : (item as Record<string, unknown>)[col.key] as ReactNode}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};