import { memo } from 'react';
import type { LabOrderItemView } from '@/lib/api/lab-api';
import LabResultFlagBadge from './LabResultFlagBadge';

function resultText(item: LabOrderItemView) {
  if (!item.resultValue) return '-';
  return item.resultUnit ? `${item.resultValue} ${item.resultUnit}` : item.resultValue;
}

function ResultsTable({ items }: { items: LabOrderItemView[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Test</th>
            <th className="px-4 py-3 font-medium">Value</th>
            <th className="px-4 py-3 font-medium">Reference Range</th>
            <th className="px-4 py-3 font-medium">Flag</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{item.labTest.name}</p>
                <p className="mt-1 text-xs text-muted">{item.labTest.code}</p>
              </td>
              <td className="px-4 py-3 text-foreground">{resultText(item)}</td>
              <td className="px-4 py-3 text-muted">{item.labTest.referenceRange ?? 'No range'}</td>
              <td className="px-4 py-3">
                <LabResultFlagBadge flag={item.flag} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ResultsTable);
