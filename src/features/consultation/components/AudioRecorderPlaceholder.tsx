import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';

export default function AudioRecorderPlaceholder() {
  return (
    <Card title="Audio Recorder" subtitle="Consultation audio">
      <Button type="button" variant="secondary" disabled>
        Record Audio
      </Button>
    </Card>
  );
}
