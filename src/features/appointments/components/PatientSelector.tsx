import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi, type PatientRecord } from '@/lib/api/patients-api';
import { getPatientName } from '@/features/patients/hooks/usePatients';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface PatientSelectorProps {
  selectedPatient: PatientRecord | null;
  onSelect: (patient: PatientRecord) => void;
}

export default function PatientSelector({ selectedPatient, onSelect }: PatientSelectorProps) {
  const [search, setSearch] = useState('');
  const params = useMemo(
    () => ({
      page: 1,
      limit: 8,
      search: search.trim() || undefined,
    }),
    [search]
  );
  const patientsQuery = useQuery({
    queryKey: ['appointments', 'patient-search', params],
    queryFn: () => patientsApi.list(params),
    retry: false,
  });
  const rows = patientsQuery.data?.items ?? [];

  return (
    <div className="space-y-3">
      <Input
        label="Patient"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search patient name, email, or phone..."
      />

      {selectedPatient ? (
        <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {`Selected patient: ${getPatientName(selectedPatient)}`}
        </p>
      ) : null}

      {patientsQuery.isLoading ? <div className="rounded-xl border border-border p-3 text-sm text-muted">Loading patients...</div> : null}
      {patientsQuery.isError ? <FeedbackMessage type="error" message="Patients could not be loaded" /> : null}

      {!patientsQuery.isLoading && !patientsQuery.isError ? (
        <div className="overflow-hidden rounded-xl border border-border">
          {rows.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No patients found.</p>
          ) : (
            rows.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => onSelect(patient)}
                className={`block w-full border-t border-border px-3 py-2 text-left text-sm first:border-t-0 hover:bg-surface ${
                  selectedPatient?.id === patient.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                <span className="font-medium">{getPatientName(patient)}</span>
                <span className="ml-2 text-muted">{patient.email ?? patient.phone ?? ''}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
