import { memo, useMemo } from 'react';
import type { ReportRow } from '@/lib/api/reports-api';
import { formatOptionLabel, formatReportValue, tableColumns } from '@/features/reports/reportConfig';

function ReportDataTable({ rows }: { rows: ReportRow[] }) {
  const columns = useMemo(() => tableColumns(rows), [rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
        No rows returned.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {formatOptionLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.group ?? 'row'}-${index}`} className="border-t border-border align-top">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-3 text-foreground">
                    {formatReportValue(row[column])}
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

export default memo(ReportDataTable);
