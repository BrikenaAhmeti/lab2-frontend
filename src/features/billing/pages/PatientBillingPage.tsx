import { useAppSelector } from '@/app/hooks';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import PatientBillingPanel from '@/features/billing/components/PatientBillingPanel';
import { resolveBillingPatientId } from '@/features/billing/components/billingFormat';

export default function PatientBillingPage() {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = resolveBillingPatientId(user);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Billing' }]} />

      {!patientId ? <FeedbackMessage type="error" message="Patient profile could not be resolved from your session" /> : null}

      <Card title="My Billing" subtitle="Billing history with MedSphere PDF statement previews">
        <PatientBillingPanel patientId={patientId} />
      </Card>
    </div>
  );
}
