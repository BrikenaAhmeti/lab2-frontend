import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';

export default function LabOrderPlaceholder() {
  return (
    <Card title="Lab Order" subtitle="Order details">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Test" disabled />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Priority</span>
          <select
            disabled
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option>Normal</option>
            <option>Urgent</option>
          </select>
        </label>
        <Input label="Lab Instructions" disabled />
        <div className="flex items-end justify-end">
          <Button type="button" disabled>
            Create Lab Order
          </Button>
        </div>
      </div>
    </Card>
  );
}
