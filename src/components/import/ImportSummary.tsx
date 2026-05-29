import type { ImportResult } from '@/lib/api/data-exchange-api';

interface ImportSummaryProps {
  result: ImportResult;
}

export default function ImportSummary({ result }: ImportSummaryProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">Summary</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-surface/60 p-3">
          <p className="text-xs font-medium uppercase text-muted">Total rows</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{result.totalRows}</p>
        </div>
        <div className="rounded-lg bg-success/10 p-3">
          <p className="text-xs font-medium uppercase text-success">Imported</p>
          <p className="mt-1 text-xl font-semibold text-success">{result.importedRows}</p>
        </div>
        <div className="rounded-lg bg-warning/10 p-3">
          <p className="text-xs font-medium uppercase text-warning">Skipped</p>
          <p className="mt-1 text-xl font-semibold text-warning">{result.skippedRows}</p>
        </div>
      </div>

      {result.errors.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Row</th>
                <th className="px-3 py-2 font-medium">Field</th>
                <th className="px-3 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((error, index) => (
                <tr key={`${error.row}-${error.field ?? 'row'}-${index}`} className="border-t border-border">
                  <td className="px-3 py-2">{error.row}</td>
                  <td className="px-3 py-2">{error.field ?? '-'}</td>
                  <td className="px-3 py-2">{error.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">No row-level errors.</p>
      )}
    </section>
  );
}
