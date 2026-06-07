import { useId } from 'react';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';

export interface BirthdayFieldProps {
  id?: string;
  label: string;
  value: string;
  className?: string;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  min?: string;
  max?: string;
  required?: boolean;
  autoComplete?: string;
  showAge?: boolean;
  ageLabel?: (age: number) => string;
  onChange: (value: string) => void;
}

function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function birthdayFromInput(value: unknown) {
  if (typeof value !== 'string') return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }

  return date;
}

function getAge(value: unknown) {
  const birthday = birthdayFromInput(value);
  if (!birthday) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthday > today) return null;

  let age = today.getFullYear() - birthday.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());

  if (!hasBirthdayPassed) age -= 1;

  return age;
}

export default function BirthdayField({
  id,
  label,
  value,
  helperText,
  error,
  className,
  disabled,
  showAge = false,
  ageLabel = (age) => `${age} years old`,
  max,
  min = '1900-01-01',
  required,
  autoComplete,
  onChange,
}: BirthdayFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const age = showAge ? getAge(value) : null;
  const visibleHelper = age !== null ? ageLabel(age) : helperText;

  return (
    <CalendarDatePicker
      id={inputId}
      label={label}
      value={value}
      min={min}
      max={max ?? todayInputValue()}
      className={className}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      error={error}
      helperText={visibleHelper}
      onChange={onChange}
    />
  );
}
