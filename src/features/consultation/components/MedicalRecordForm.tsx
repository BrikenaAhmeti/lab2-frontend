import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { MedicalRecordFieldsPayload, MedicalRecordView } from '@/lib/api/medical-records-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { formatClinicalValue } from './clinicalFormat';

const medicalRecordFormSchema = z.object({
  chiefComplaint: z.string().max(2000).optional(),
  vitals: z.string().optional(),
  diagnosis: z.string().max(2000).optional(),
  treatmentPlan: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional(),
  followUpInstructions: z.string().max(2000).optional(),
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordFormSchema>;

const emptyValues: MedicalRecordFormValues = {
  chiefComplaint: '',
  vitals: '',
  diagnosis: '',
  treatmentPlan: '',
  notes: '',
  followUpInstructions: '',
};

function textOrNull(value?: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

export function toMedicalRecordPayload(values: MedicalRecordFormValues): MedicalRecordFieldsPayload {
  const vitals = values.vitals?.trim();

  return {
    chiefComplaint: textOrNull(values.chiefComplaint),
    diagnosis: textOrNull(values.diagnosis),
    treatmentPlan: textOrNull(values.treatmentPlan),
    notes: textOrNull(values.notes),
    followUpInstructions: textOrNull(values.followUpInstructions),
    ...(vitals ? { vitals } : {}),
  };
}

function valuesFromRecord(record: MedicalRecordView | null): MedicalRecordFormValues {
  if (!record) return emptyValues;

  return {
    chiefComplaint: record.chiefComplaint ?? '',
    vitals: formatClinicalValue(record.vitals) === '-' ? '' : formatClinicalValue(record.vitals),
    diagnosis: record.diagnosis ?? '',
    treatmentPlan: record.treatmentPlan ?? '',
    notes: record.notes ?? '',
    followUpInstructions: record.followUpInstructions ?? '',
  };
}

export default function MedicalRecordForm({
  record,
  saving,
  finalizing,
  disabled,
  error,
  onSave,
  onFinalize,
}: {
  record: MedicalRecordView | null;
  saving?: boolean;
  finalizing?: boolean;
  disabled?: boolean;
  error?: string;
  onSave: (values: MedicalRecordFormValues) => Promise<void>;
  onFinalize: () => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isFinalized = Boolean(record?.isFinalized);
  const isLocked = isFinalized || Boolean(disabled);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    reset(valuesFromRecord(record));
  }, [record, reset]);

  return (
    <Card
      title="Medical Record"
      subtitle={isFinalized ? 'Finalized' : record ? 'Draft' : 'New draft'}
      actions={
        <Button
          type="button"
          variant="secondary"
          disabled={!record || isLocked || saving || finalizing}
          onClick={() => setConfirmOpen(true)}
        >
          Finalize
        </Button>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
        {error ? <FeedbackMessage type="error" message={error} /> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label htmlFor="medical-record-chief-complaint" className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Chief Complaint</span>
            <textarea
              id="medical-record-chief-complaint"
              disabled={isLocked || saving}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              {...register('chiefComplaint')}
            />
            {errors.chiefComplaint ? <p className="text-xs text-danger">{errors.chiefComplaint.message}</p> : null}
          </label>

          <label htmlFor="medical-record-vitals" className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Vitals</span>
            <textarea
              id="medical-record-vitals"
              disabled={isLocked || saving}
              className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              {...register('vitals')}
            />
            {errors.vitals ? <p className="text-xs text-danger">{errors.vitals.message}</p> : null}
          </label>

          <label htmlFor="medical-record-diagnosis" className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Diagnosis</span>
            <textarea
              id="medical-record-diagnosis"
              disabled={isLocked || saving}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              {...register('diagnosis')}
            />
            {errors.diagnosis ? <p className="text-xs text-danger">{errors.diagnosis.message}</p> : null}
          </label>

          <label htmlFor="medical-record-treatment-plan" className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Treatment Plan</span>
            <textarea
              id="medical-record-treatment-plan"
              disabled={isLocked || saving}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              {...register('treatmentPlan')}
            />
            {errors.treatmentPlan ? <p className="text-xs text-danger">{errors.treatmentPlan.message}</p> : null}
          </label>

          <Input
            id="medical-record-follow-up"
            label="Follow-up Instructions"
            disabled={isLocked || saving}
            error={errors.followUpInstructions?.message}
            {...register('followUpInstructions')}
          />

          <label htmlFor="medical-record-notes" className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Notes</span>
            <textarea
              id="medical-record-notes"
              disabled={isLocked || saving}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              {...register('notes')}
            />
            {errors.notes ? <p className="text-xs text-danger">{errors.notes.message}</p> : null}
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={isLocked}>
            {record ? 'Save record' : 'Create record'}
          </Button>
        </div>
      </form>

      {confirmOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
          <section role="dialog" aria-modal="true" className="panel w-full max-w-md p-5">
            <h2 className="text-lg font-semibold text-foreground">Finalize record?</h2>
            <p className="mt-2 text-sm text-muted">Finalized records can only be changed through amendments.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                Keep draft
              </Button>
              <Button
                type="button"
                loading={finalizing}
                onClick={async () => {
                  await onFinalize();
                  setConfirmOpen(false);
                }}
              >
                Finalize record
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </Card>
  );
}
