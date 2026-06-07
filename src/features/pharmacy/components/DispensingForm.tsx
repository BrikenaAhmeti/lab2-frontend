import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  DispensePharmacyQueuePayload,
  PharmacyDispensingItemView,
  PharmacyDispensingStatusInput,
  PharmacyQueueView,
} from '@/lib/api/pharmacy-api';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import PharmacyStatusBadge from './PharmacyStatusBadge';
import { dispensingStatusOptions, toDispensingStatusInput } from './pharmacyFormat';

interface DispensingDraft {
  status: PharmacyDispensingStatusInput;
  inventoryItemId: string;
  quantityDispensed: string;
  notes: string;
}

interface DispensingFormProps {
  queue: PharmacyQueueView;
  loading?: boolean;
  disabled?: boolean;
  onSave: (payload: DispensePharmacyQueuePayload) => void;
}

function toDraft(queue: PharmacyQueueView) {
  return Object.fromEntries(
    queue.dispensingItems.map((item) => {
      const status = toDispensingStatusInput(item.status);

      return [
        item.prescriptionItemId,
        {
          status,
          inventoryItemId: item.inventoryItemId ?? '',
          quantityDispensed: status === 'out_of_stock' ? '0' : String(item.quantityDispensed ?? item.quantityToDispense),
          notes: item.notes ?? '',
        },
      ];
    })
  ) as Record<string, DispensingDraft>;
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function inventoryLabel(item: PharmacyDispensingItemView) {
  if (!item.inventoryItem) return 'No inventory item selected';
  return `${item.inventoryItem.name} (${item.inventoryItem.sku}) - ${item.inventoryItem.currentStock} ${item.inventoryItem.unitOfMeasure}`;
}

function validateDraft(queue: PharmacyQueueView, draft: Record<string, DispensingDraft>) {
  for (const item of queue.dispensingItems) {
    const itemDraft = draft[item.prescriptionItemId];
    if (!itemDraft) return `${item.prescriptionItem.medicationName} is missing dispensing details`;

    if (itemDraft.status === 'out_of_stock') continue;

    const quantity = Number(itemDraft.quantityDispensed);

    if (!itemDraft.inventoryItemId.trim()) {
      return `${item.prescriptionItem.medicationName} needs an inventory item id`;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return `${item.prescriptionItem.medicationName} needs a positive dispensed quantity`;
    }

    if (quantity > item.quantityToDispense) {
      return `${item.prescriptionItem.medicationName} quantity cannot exceed ${item.quantityToDispense}`;
    }
  }

  return '';
}

function toPayload(queue: PharmacyQueueView, draft: Record<string, DispensingDraft>): DispensePharmacyQueuePayload {
  return {
    items: queue.dispensingItems.map((item) => {
      const itemDraft = draft[item.prescriptionItemId];

      if (itemDraft.status === 'out_of_stock') {
        return {
          prescriptionItemId: item.prescriptionItemId,
          inventoryItemId: null,
          quantityDispensed: 0,
          status: itemDraft.status,
          notes: nullableText(itemDraft.notes),
        };
      }

      return {
        prescriptionItemId: item.prescriptionItemId,
        inventoryItemId: itemDraft.inventoryItemId.trim(),
        quantityDispensed: Number(itemDraft.quantityDispensed),
        status: itemDraft.status,
        notes: nullableText(itemDraft.notes),
      };
    }),
  };
}

export default function DispensingForm({ queue, loading, disabled, onSave }: DispensingFormProps) {
  const [draft, setDraft] = useState<Record<string, DispensingDraft>>(() => toDraft(queue));
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    setDraft(toDraft(queue));
    setClientError('');
  }, [queue]);

  const payload = useMemo(() => toPayload(queue, draft), [draft, queue]);

  const updateDraft = (item: PharmacyDispensingItemView, field: keyof DispensingDraft, value: string) => {
    setDraft((current) => {
      const previous = current[item.prescriptionItemId] ?? {
        status: 'dispensed' as const,
        inventoryItemId: '',
        quantityDispensed: String(item.quantityToDispense),
        notes: '',
      };
      const next = { ...previous, [field]: value };

      if (field === 'status' && value === 'out_of_stock') {
        next.inventoryItemId = '';
        next.quantityDispensed = '0';
      }

      if (field === 'status' && value !== 'out_of_stock' && previous.status === 'out_of_stock') {
        next.quantityDispensed = String(item.quantityToDispense);
      }

      return {
        ...current,
        [item.prescriptionItemId]: next,
      };
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const message = validateDraft(queue, draft);

        if (message) {
          setClientError(message);
          return;
        }

        setClientError('');
        onSave(payload);
      }}
    >
      <div className="space-y-3">
        {queue.dispensingItems.map((item) => {
          const itemDraft = draft[item.prescriptionItemId] ?? {
            status: 'dispensed' as const,
            inventoryItemId: '',
            quantityDispensed: String(item.quantityToDispense),
            notes: '',
          };
          const outOfStock = itemDraft.status === 'out_of_stock';

          return (
            <section key={item.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{item.prescriptionItem.medicationName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.prescriptionItem.dosage} | {item.prescriptionItem.frequency}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Qty to dispense: {item.quantityToDispense}
                    {item.prescriptionItem.durationInstructions ? ` | ${item.prescriptionItem.durationInstructions}` : ''}
                  </p>
                </div>
                <PharmacyStatusBadge status={item.status} />
              </div>

              {item.prescriptionItem.notes ? (
                <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-muted">{item.prescriptionItem.notes}</p>
              ) : null}

              <p className="mt-3 text-xs text-muted">{inventoryLabel(item)}</p>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]">
                <label htmlFor={`dispensing-status-${item.id}`} className="block space-y-1.5">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <select
                    id={`dispensing-status-${item.id}`}
                    value={itemDraft.status}
                    disabled={disabled}
                    onChange={(event) => updateDraft(item, 'status', event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {dispensingStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <Input
                  id={`inventory-item-${item.id}`}
                  label="Inventory item id"
                  value={itemDraft.inventoryItemId}
                  disabled={disabled || outOfStock}
                  onChange={(event) => updateDraft(item, 'inventoryItemId', event.target.value)}
                  placeholder="UUID from inventory"
                />

                <Input
                  id={`quantity-dispensed-${item.id}`}
                  label="Quantity"
                  type="number"
                  min={0}
                  max={item.quantityToDispense}
                  value={itemDraft.quantityDispensed}
                  disabled={disabled || outOfStock}
                  onChange={(event) => updateDraft(item, 'quantityDispensed', event.target.value)}
                />
              </div>

              <label htmlFor={`dispensing-notes-${item.id}`} className="mt-3 block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Notes</span>
                <textarea
                  id={`dispensing-notes-${item.id}`}
                  value={itemDraft.notes}
                  disabled={disabled}
                  onChange={(event) => updateDraft(item, 'notes', event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Optional notes"
                />
              </label>
            </section>
          );
        })}
      </div>

      {clientError ? <FeedbackMessage type="error" message={clientError} /> : null}

      <Button type="submit" loading={loading} disabled={disabled || queue.dispensingItems.length === 0} leftIcon={<Save className="h-4 w-4" />}>
        Save Dispensing
      </Button>
    </form>
  );
}
