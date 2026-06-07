import type { MedicalRecordView } from '@/lib/api/medical-records-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import type { PrescriptionView } from '@/lib/api/prescriptions-api';
import Badge from '@/ui/atoms/Badge';
import Card from '@/ui/atoms/Card';
import { formatBloodType } from '@/features/patients/components/patientFormat';
import { formatClinicalValue, formatDateTime } from './clinicalFormat';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function currentMedicationLabels(prescriptions: PrescriptionView[]) {
  return prescriptions
    .filter((prescription) => !prescription.isVoided)
    .flatMap((prescription) =>
      prescription.items.map((item) => `${item.medicationName} ${item.dosage}`.trim())
    )
    .slice(0, 6);
}

export default function PatientSummaryPanel({
  patient,
  records,
  prescriptions,
  loading,
}: {
  patient: PatientRecord | null;
  records: MedicalRecordView[];
  prescriptions: PrescriptionView[];
  loading?: boolean;
}) {
  const medications = currentMedicationLabels(prescriptions);
  const lastVisits = records.slice(0, 3);

  return (
    <Card title="Patient Summary" subtitle={patient ? `${patient.firstName} ${patient.lastName}` : 'Loading'}>
      {loading ? (
        <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading patient summary...</div>
      ) : null}

      {patient ? (
        <div className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={patient.email ?? '-'} />
            <Field label="Phone" value={patient.phone ?? '-'} />
            <Field label="Blood type" value={formatBloodType(patient.bloodType)} />
            <Field label="Allergies" value={formatClinicalValue(patient.allergies)} />
            <Field label="Medical notes" value={formatClinicalValue(patient.medicalNotes)} />
          </dl>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Current Medications</h3>
            {medications.length ? (
              <div className="flex flex-wrap gap-2">
                {medications.map((medication) => (
                  <Badge key={medication} variant="info">
                    {medication}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">-</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Last Visits</h3>
            {lastVisits.length ? (
              <ol className="space-y-2">
                {lastVisits.map((record) => (
                  <li key={record.id} className="rounded-xl border border-border bg-background p-3">
                    <p className="text-sm font-medium text-foreground">{record.diagnosis || 'No diagnosis'}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(record.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">-</p>
            )}
          </section>
        </div>
      ) : null}
    </Card>
  );
}
