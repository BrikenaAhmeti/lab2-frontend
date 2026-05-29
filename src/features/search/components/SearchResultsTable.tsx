import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SearchSortOrder } from '@/lib/api/search-api';

export interface SearchColumn<T> {
  key: string;
  label: string;
  sortBy?: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface SearchResultsTableProps<T> {
  rows: T[];
  columns: Array<SearchColumn<T>>;
  sortBy: string;
  sortOrder: SearchSortOrder;
  onSort: (sortBy: string) => void;
}

function SortIcon({
  active,
  sortOrder,
}: {
  active: boolean;
  sortOrder: SearchSortOrder;
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5" />;
  return sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
}

export default function SearchResultsTable<T>({
  rows,
  columns,
  sortBy,
  sortOrder,
  onSort,
}: SearchResultsTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 font-medium ${column.className ?? ''}`.trim()}>
                {column.sortBy ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.sortBy!)}
                    className="inline-flex items-center gap-1.5 text-left transition hover:text-foreground"
                  >
                    <span>{column.label}</span>
                    <SortIcon active={sortBy === column.sortBy} sortOrder={sortOrder} />
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={'id' in Object(row) ? String((row as { id?: string }).id ?? index) : index} className="border-t border-border">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-top ${column.className ?? ''}`.trim()}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
