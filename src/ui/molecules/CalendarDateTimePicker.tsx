import clsx from 'clsx';
import Input from '@/ui/atoms/Input';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';

export interface CalendarDateTimePickerProps {
  id: string;
  label: string;
  value: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  defaultTime?: string;
  onChange: (value: string) => void;
}

function splitDateTime(value: string) {
  const [date = '', time = ''] = value.split('T');

  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    time: /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : '',
  };
}

function combineDateTime(date: string, time: string) {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

export default function CalendarDateTimePicker({
  id,
  label,
  value,
  className,
  disabled,
  error,
  helperText,
  defaultTime = '00:00',
  onChange,
}: CalendarDateTimePickerProps) {
  const { date, time } = splitDateTime(value);
  const timeId = `${id}-time`;

  return (
    <div className={clsx('grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]', className)}>
      <CalendarDatePicker
        id={id}
        label={label}
        value={date}
        disabled={disabled}
        error={error}
        helperText={helperText}
        onChange={(nextDate) => onChange(combineDateTime(nextDate, time || defaultTime))}
      />
      <Input
        id={timeId}
        label="Time"
        type="time"
        value={time}
        disabled={disabled || !date}
        onChange={(event) => onChange(combineDateTime(date, event.target.value || defaultTime))}
      />
    </div>
  );
}
