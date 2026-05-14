import Card from '@/ui/atoms/Card';

export default function SettingsPage() {
  return (
    <Card title="Settings" subtitle="Global settings editor placeholder for MS-9 wiring">
      <p className="text-sm text-muted">
        Facility information, slot duration, working hours, notification preferences, and password policy
        will be wired here when the settings UI is connected.
      </p>
    </Card>
  );
}
