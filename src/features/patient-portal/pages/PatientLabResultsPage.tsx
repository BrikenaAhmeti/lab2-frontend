import { useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import { resolvePatientId } from '@/features/appointments/hooks/useAppointments';
import LabOrderStatusBadge from '@/features/lab/components/LabOrderStatusBadge';
import ResultsTable from '@/features/lab/components/ResultsTable';
import { formatLabDateTime } from '@/features/lab/components/labFormat';
import { getLabApiErrorMessage, useLabOrders } from '@/features/lab/hooks/useLabOrders';
import Badge from '@/ui/atoms/Badge';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import PatientLabInterpretationPanel from '../components/PatientLabInterpretationPanel';
import { PatientPortalEmptyState, PatientPortalLoadingState } from '../components/PatientPortalStates';

export default function PatientLabResultsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = resolvePatientId(user);
  const params = useMemo(() => ({ page: 1, limit: 50, patientId }), [patientId]);
  const labOrdersQuery = useLabOrders(params, Boolean(patientId));
  const labOrders = labOrdersQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Lab Results' }]} />

      {!patientId ? <FeedbackMessage type="error" message="Patient profile could not be resolved from your session" /> : null}

      <Card title="Lab Results" subtitle="Read-only lab orders, result values, flags, and patient explanations">
        <div className="space-y-3">
          {labOrdersQuery.isLoading ? <PatientPortalLoadingState>Loading lab results...</PatientPortalLoadingState> : null}
          {labOrdersQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getLabApiErrorMessage(labOrdersQuery.error, 'Lab results could not be loaded')}
            />
          ) : null}
          {!labOrdersQuery.isLoading && !labOrdersQuery.isError && labOrders.length === 0 ? (
            <PatientPortalEmptyState>No lab results yet.</PatientPortalEmptyState>
          ) : null}

          {labOrders.map((order) => (
            <article key={order.id} className="space-y-4 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <LabOrderStatusBadge status={order.status} />
                    {order.priority ? <Badge>{order.priority}</Badge> : null}
                  </div>
                  <h2 className="mt-2 font-semibold text-foreground">{order.department.name}</h2>
                  <p className="mt-1 text-sm text-muted">{`Ordered ${formatLabDateTime(order.orderedAt)}`}</p>
                </div>
                <p className="text-sm text-muted">{order.orderedByStaff.displayName}</p>
              </div>

              {order.status === 'COMPLETED' ? (
                <>
                  <ResultsTable items={order.items} />
                  <PatientLabInterpretationPanel labOrderId={order.id} enabled={order.status === 'COMPLETED'} />
                </>
              ) : (
                <PatientPortalEmptyState>Results will appear after the lab order is completed.</PatientPortalEmptyState>
              )}
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
