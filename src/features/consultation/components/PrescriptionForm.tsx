import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CreatePrescriptionPayload } from '@/lib/api/prescriptions-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

const prescriptionItemSchema = z.object({
  medicationName: z.string().trim().min(1, 'Medication is required').max(200),
  dosage: z.string().trim().min(1, 'Dosage is required').max(200),
  frequency: z.string().trim().min(1, 'Frequency is required').max(200),
  durationInstructions: z.string().max(1000).optional(),
  quantityPrescribed: z.number().int().min(1, 'Quantity is required').max(100000),
  notes: z.string().max(1000).optional(),
});

const prescriptionFormSchema = z.object({
  expiresAt: z.string().optional(),
  notes: z.string().max(4000).optional(),
  items: z.array(prescriptionItemSchema).min(1),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

const emptyItem: PrescriptionFormValues['items'][number] = {
  medicationName: '',
  dosage: '',
  frequency: '',
  durationInstructions: '',
  quantityPrescribed: 1,
  notes: '',
};

const emptyValues: PrescriptionFormValues = {
  expiresAt: '',
  notes: '',
  items: [emptyItem],
};

function textOrNull(value?: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

function toPrescriptionPayload(
  medicalRecordId: string,
  values: PrescriptionFormValues
): CreatePrescriptionPayload {
  return {
    medicalRecordId,
    ...(values.expiresAt ? { expiresAt: new Date(values.expiresAt).toISOString() } : {}),
    notes: textOrNull(values.notes),
    items: values.items.map((item) => ({
      medicationName: item.medicationName.trim(),
      dosage: item.dosage.trim(),
      frequency: item.frequency.trim(),
      durationInstructions: textOrNull(item.durationInstructions),
      quantityPrescribed: Number(item.quantityPrescribed),
      notes: textOrNull(item.notes),
    })),
  };
}

export default function PrescriptionForm({
  medicalRecordId,
  disabled,
  loading,
  error,
  onSubmit,
}: {
  medicalRecordId: string | null;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  onSubmit: (payload: CreatePrescriptionPayload) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: emptyValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const formDisabled = disabled || !medicalRecordId || loading;

  const submit = async (values: PrescriptionFormValues) => {
    if (!medicalRecordId) return;
    await onSubmit(toPrescriptionPayload(medicalRecordId, values));
    reset(emptyValues);
  };

  return (
    <Card title="Prescription" subtitle="Medication items">
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error ? <FeedbackMessage type="error" message={error} /> : null}
        {!medicalRecordId ? <FeedbackMessage type="error" message="Create the medical record before adding prescriptions." /> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="prescription-expires-at"
            label="Expires At"
            type="date"
            disabled={formDisabled}
            error={errors.expiresAt?.message}
            {...register('expiresAt')}
          />
          <Input
            id="prescription-notes"
            label="Prescription Notes"
            disabled={formDisabled}
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <fieldset key={field.id} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-foreground">{`Medication ${index + 1}`}</legend>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={formDisabled || fields.length === 1}
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Medication"
                  disabled={formDisabled}
                  error={errors.items?.[index]?.medicationName?.message}
                  {...register(`items.${index}.medicationName`)}
                />
                <Input
                  label="Dosage"
                  disabled={formDisabled}
                  error={errors.items?.[index]?.dosage?.message}
                  {...register(`items.${index}.dosage`)}
                />
                <Input
                  label="Frequency"
                  disabled={formDisabled}
                  error={errors.items?.[index]?.frequency?.message}
                  {...register(`items.${index}.frequency`)}
                />
                <Input
                  label="Duration"
                  disabled={formDisabled}
                  error={errors.items?.[index]?.durationInstructions?.message}
                  {...register(`items.${index}.durationInstructions`)}
                />
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  disabled={formDisabled}
                  error={errors.items?.[index]?.quantityPrescribed?.message}
                  {...register(`items.${index}.quantityPrescribed`, { valueAsNumber: true })}
                />
                <Input
                  label="Instructions"
                  disabled={formDisabled}
                  error={errors.items?.[index]?.notes?.message}
                  {...register(`items.${index}.notes`)}
                />
              </div>
            </fieldset>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={formDisabled}
            onClick={() => append({ ...emptyItem })}
          >
            Add Medication
          </Button>
          <Button type="submit" loading={loading} disabled={formDisabled}>
            Create Prescription
          </Button>
        </div>
      </form>
    </Card>
  );
}
