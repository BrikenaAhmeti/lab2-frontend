import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { EnterLabResultsPayload, LabOrderView } from '@/lib/api/lab-api';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import LabResultFlagBadge from './LabResultFlagBadge';
import { previewLabResultFlag } from './labFormat';

interface ResultDraft {
  resultValue: string;
  resultUnit: string;
  resultNotes: string;
}

interface ResultEntryFormProps {
  order: LabOrderView;
  loading?: boolean;
  onSave: (payload: EnterLabResultsPayload) => void;
}

function toDraft(order: LabOrderView) {
  return Object.fromEntries(
    order.items.map((item) => [
      item.id,
      {
        resultValue: item.resultValue ?? '',
        resultUnit: item.resultUnit ?? '',
        resultNotes: item.resultNotes ?? '',
      },
    ])
  ) as Record<string, ResultDraft>;
}

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function ResultEntryForm({ order, loading, onSave }: ResultEntryFormProps) {
  const [draft, setDraft] = useState<Record<string, ResultDraft>>(() => toDraft(order));

  useEffect(() => {
    setDraft(toDraft(order));
  }, [order]);

  const resultItems = useMemo(
    () => {
      const items: EnterLabResultsPayload['items'] = [];

      order.items.forEach((item) => {
        const itemDraft = draft[item.id];
        const resultValue = itemDraft?.resultValue.trim() ?? '';

        if (resultValue) {
          items.push({
            itemId: item.id,
            resultValue,
            resultUnit: toNullable(itemDraft?.resultUnit ?? ''),
            resultNotes: toNullable(itemDraft?.resultNotes ?? ''),
          });
        }
      });

      return items;
    },
    [draft, order.items]
  );

  const updateDraft = (itemId: string, field: keyof ResultDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [itemId]: {
        resultValue: current[itemId]?.resultValue ?? '',
        resultUnit: current[itemId]?.resultUnit ?? '',
        resultNotes: current[itemId]?.resultNotes ?? '',
        [field]: value,
      },
    }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ items: resultItems });
      }}
    >
      <div className="space-y-3">
        {order.items.map((item) => {
          const itemDraft = draft[item.id] ?? { resultValue: '', resultUnit: '', resultNotes: '' };
          const flag = previewLabResultFlag(itemDraft.resultValue, item.labTest.referenceRange);

          return (
            <section key={item.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{item.labTest.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.labTest.referenceRange ? `Reference ${item.labTest.referenceRange}` : 'No reference range'}
                  </p>
                </div>
                <LabResultFlagBadge flag={itemDraft.resultValue ? flag : item.flag} />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
                <Input
                  id={`lab-result-${item.id}`}
                  label={`${item.labTest.name} result value`}
                  value={itemDraft.resultValue}
                  onChange={(event) => updateDraft(item.id, 'resultValue', event.target.value)}
                  placeholder="Example: 95"
                />
                <Input
                  id={`lab-unit-${item.id}`}
                  label={`${item.labTest.name} unit`}
                  value={itemDraft.resultUnit}
                  onChange={(event) => updateDraft(item.id, 'resultUnit', event.target.value)}
                  placeholder="mg/dL"
                />
              </div>

              <label htmlFor={`lab-notes-${item.id}`} className="mt-3 block space-y-1.5">
                <span className="text-sm font-medium text-foreground">{`${item.labTest.name} notes`}</span>
                <textarea
                  id={`lab-notes-${item.id}`}
                  value={itemDraft.resultNotes}
                  onChange={(event) => updateDraft(item.id, 'resultNotes', event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional notes"
                />
              </label>
            </section>
          );
        })}
      </div>

      <Button type="submit" loading={loading} disabled={resultItems.length === 0} leftIcon={<Save className="h-4 w-4" />}>
        Save Results
      </Button>
    </form>
  );
}
