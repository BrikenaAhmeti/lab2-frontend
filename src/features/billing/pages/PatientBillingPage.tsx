import { useResolvedPatientSession } from '@/features/auth/hooks/useResolvedPatientSession';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import PatientBillingPanel from '@/features/billing/components/PatientBillingPanel';

export default function PatientBillingPage() {
  const patientSession = useResolvedPatientSession();
  const patientId = patientSession.patientId;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Billing' }]} />

      <Card title="My Billing" subtitle="Billing history with MedSphere PDF statement previews">
        {patientSession.isResolving && !patientId ? (
          <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading billing history...</div>
        ) : null}
        {patientId ? <PatientBillingPanel patientId={patientId} /> : null}
      </Card>
    </div>
  );
}
