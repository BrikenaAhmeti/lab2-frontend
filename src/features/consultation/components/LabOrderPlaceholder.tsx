import { type FormEvent, useMemo, useState } from 'react';
import type { AppointmentView } from '@/lib/api/appointments-api';
import type { LabOrderPriority, LabOrderView, LabTestView } from '@/lib/api/lab-api';
import { getLabApiErrorMessage, useCreateLabOrder, useLabTests } from '@/features/lab/hooks/useLabOrders';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

const emptyLabTests: LabTestView[] = [];

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function labTestDescription(test: LabTestView) {
  return [test.code, test.category, test.sampleType].filter(Boolean).join(' - ');
}

export default function LabOrderPlaceholder({
  appointment,
  medicalRecordId,
  disabled,
  onCreated,
}: {
  appointment: AppointmentView;
  medicalRecordId: string | null;
  disabled?: boolean;
  onCreated?: (order: LabOrderView) => void;
}) {
  const labTestsQuery = useLabTests({ page: 1, limit: 100, isActive: true });
  const createMutation = useCreateLabOrder();
  const [search, setSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<LabOrderPriority>('normal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const labTests = labTestsQuery.data?.items ?? emptyLabTests;
  const filteredLabTests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return labTests;

    return labTests.filter((test) =>
      [test.name, test.code, test.category, test.sampleType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [labTests, search]);
  const controlsDisabled = disabled || createMutation.isPending || !appointment.staffProfileId;
  const submitDisabled = controlsDisabled || labTestsQuery.isLoading || selectedTests.length === 0;

  const toggleTest = (testId: string) => {
    setSelectedTests((current) =>
      current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!appointment.staffProfileId || selectedTests.length === 0) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const order = await createMutation.mutateAsync({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        medicalRecordId,
        orderedByStaffId: appointment.staffProfileId,
        priority,
        notes: textOrNull(notes),
        tests: selectedTests,
      });

      setSelectedTests([]);
      setPriority('normal');
      setNotes('');
      setSearch('');
      setSuccess('Lab order created.');
      onCreated?.(order);
    } catch (labOrderError) {
      setError(getLabApiErrorMessage(labOrderError, 'Lab order could not be created'));
    }
  };

  return (
    <Card title="Lab Order" subtitle="Order details">
      <form className="space-y-4" onSubmit={submit}>
        {success ? <FeedbackMessage type="success" message={success} /> : null}
        {error ? <FeedbackMessage type="error" message={error} /> : null}
        {!appointment.staffProfileId ? (
          <FeedbackMessage type="error" message="This appointment has no staff profile assigned." />
        ) : null}
        {labTestsQuery.isError ? (
          <FeedbackMessage
            type="error"
            message={getLabApiErrorMessage(labTestsQuery.error, 'Lab tests could not be loaded')}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="lab-order-test-search"
            label="Test"
            value={search}
            disabled={controlsDisabled || labTestsQuery.isLoading}
            placeholder="Search by test, code, or category"
            onChange={(event) => setSearch(event.target.value)}
          />
          <label htmlFor="lab-order-priority" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Priority</span>
            <select
              id="lab-order-priority"
              value={priority}
              disabled={controlsDisabled}
              onChange={(event) => setPriority(event.target.value as LabOrderPriority)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>

        <label htmlFor="lab-order-notes" className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Lab Instructions</span>
          <textarea
            id="lab-order-notes"
            value={notes}
            disabled={controlsDisabled}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Available tests</h3>
            <span className="text-xs font-medium text-muted">{selectedTests.length} selected</span>
          </div>

          {labTestsQuery.isLoading ? (
            <div className="rounded-lg border border-border bg-surface/50 px-3 py-3 text-sm text-muted">
              Loading lab tests...
            </div>
          ) : null}

          {!labTestsQuery.isLoading && labTests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/50 px-3 py-3 text-sm text-muted">
              No active lab tests available.
            </div>
          ) : null}

          {!labTestsQuery.isLoading && labTests.length > 0 && filteredLabTests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/50 px-3 py-3 text-sm text-muted">
              No lab tests match this search.
            </div>
          ) : null}

          {filteredLabTests.length > 0 ? (
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {filteredLabTests.map((test) => (
                <label
                  key={test.id}
                  className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <input
                    type="checkbox"
                    aria-label={`${test.name} lab test`}
                    checked={selectedTests.includes(test.id)}
                    disabled={controlsDisabled}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                    onChange={() => toggleTest(test.id)}
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium text-foreground">{test.name}</span>
                    <span className="mt-1 block break-words text-xs text-muted">{labTestDescription(test)}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={createMutation.isPending} disabled={submitDisabled}>
            Create Lab Order
          </Button>
        </div>
      </form>
    </Card>
  );
}
