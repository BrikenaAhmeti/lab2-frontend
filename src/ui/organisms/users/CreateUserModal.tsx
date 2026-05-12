import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import PasswordRequirementsList from '@/ui/molecules/PasswordRequirementsList';
import RoleCheckboxGroup from '@/ui/molecules/RoleCheckboxGroup';

interface CreateUserValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  personalNumber: string;
  roles: string[];
}

interface CreateUserModalProps {
  open: boolean;
  labels: {
    title: string;
    subtitle: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    personalNumber: string;
    roles: string;
    rolesHelp: string;
    cancel: string;
    submit: string;
  };
  roleOptions: string[];
  values: CreateUserValues;
  errors: Partial<Record<keyof CreateUserValues, string>>;
  passwordRequirements: string[];
  loading: boolean;
  onChange: (field: keyof CreateUserValues, value: string | string[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CreateUserModal({
  open,
  labels,
  roleOptions,
  values,
  errors,
  passwordRequirements,
  loading,
  onChange,
  onClose,
  onSubmit,
}: CreateUserModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        <p className="mt-1 text-sm text-muted">{labels.subtitle}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input id="create-user-first-name" label={labels.firstName} value={values.firstName} onChange={(e) => onChange('firstName', e.target.value)} error={errors.firstName} />
          <Input id="create-user-last-name" label={labels.lastName} value={values.lastName} onChange={(e) => onChange('lastName', e.target.value)} error={errors.lastName} />
          <Input id="create-user-email" label={labels.email} value={values.email} onChange={(e) => onChange('email', e.target.value)} error={errors.email} />
          <Input id="create-user-password" label={labels.password} type="password" value={values.password} onChange={(e) => onChange('password', e.target.value)} error={errors.password} />
          <Input id="create-user-phone" label={labels.phone} value={values.phone} onChange={(e) => onChange('phone', e.target.value)} />
          <Input id="create-user-date-of-birth" label={labels.dateOfBirth} value={values.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
          <Input id="create-user-gender" label={labels.gender} value={values.gender} onChange={(e) => onChange('gender', e.target.value)} />
          <Input id="create-user-personal-number" label={labels.personalNumber} value={values.personalNumber} onChange={(e) => onChange('personalNumber', e.target.value)} />
        </div>
        <div className="mt-4">
          <RoleCheckboxGroup
            label={labels.roles}
            helperText={labels.rolesHelp}
            options={roleOptions}
            value={values.roles}
            error={errors.roles}
            onChange={(next) => onChange('roles', next)}
          />
        </div>
        <PasswordRequirementsList className="mt-4" items={passwordRequirements} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{labels.cancel}</Button>
          <Button loading={loading} onClick={onSubmit}>{labels.submit}</Button>
        </div>
      </div>
    </div>
  );
}
