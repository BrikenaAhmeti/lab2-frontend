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
  departmentId: string;
  staffPositionTypeId: string;
  employeeCode: string;
  specialization: string;
}

interface SelectOption {
  value: string;
  label: string;
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
    doctorDetails: string;
    departmentId: string;
    staffPositionTypeId: string;
    employeeCode: string;
    specialization: string;
    loadingDoctorData: string;
    doctorDataLoadFailed: string;
    selectDepartment: string;
    selectStaffPositionType: string;
    cancel: string;
    submit: string;
  };
  roleOptions: string[];
  departmentOptions: SelectOption[];
  staffPositionTypeOptions: SelectOption[];
  values: CreateUserValues;
  errors: Partial<Record<keyof CreateUserValues, string>>;
  passwordRequirements: string[];
  loading: boolean;
  doctorDataLoading: boolean;
  doctorDataError: boolean;
  onChange: (field: keyof CreateUserValues, value: string | string[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CreateUserModal({
  open,
  labels,
  roleOptions,
  departmentOptions,
  staffPositionTypeOptions,
  values,
  errors,
  passwordRequirements,
  loading,
  doctorDataLoading,
  doctorDataError,
  onChange,
  onClose,
  onSubmit,
}: CreateUserModalProps) {
  if (!open) return null;

  const showDoctorFields = values.roles.includes('Doctor');
  const selectClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

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
        {showDoctorFields && (
          <div className="mt-4 space-y-3 rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-foreground">{labels.doctorDetails}</h4>
            {doctorDataLoading && <p className="text-sm text-muted">{labels.loadingDoctorData}</p>}
            {doctorDataError && <p className="text-sm text-danger">{labels.doctorDataLoadFailed}</p>}
            <div className="grid gap-3 md:grid-cols-2">
              <label htmlFor="create-user-department" className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">{labels.departmentId}</span>
                <select
                  id="create-user-department"
                  className={`${selectClass} ${errors.departmentId ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`}
                  value={values.departmentId}
                  disabled={doctorDataLoading}
                  onChange={(event) => onChange('departmentId', event.target.value)}
                >
                  <option value="">{labels.selectDepartment}</option>
                  {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-xs text-danger">{errors.departmentId}</p>}
              </label>
              <label htmlFor="create-user-position-type" className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">{labels.staffPositionTypeId}</span>
                <select
                  id="create-user-position-type"
                  className={`${selectClass} ${errors.staffPositionTypeId ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`}
                  value={values.staffPositionTypeId}
                  disabled={doctorDataLoading}
                  onChange={(event) => onChange('staffPositionTypeId', event.target.value)}
                >
                  <option value="">{labels.selectStaffPositionType}</option>
                  {staffPositionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.staffPositionTypeId && <p className="text-xs text-danger">{errors.staffPositionTypeId}</p>}
              </label>
              <Input id="create-user-employee-code" label={labels.employeeCode} value={values.employeeCode} onChange={(e) => onChange('employeeCode', e.target.value)} error={errors.employeeCode} />
              <Input id="create-user-specialization" label={labels.specialization} value={values.specialization} onChange={(e) => onChange('specialization', e.target.value)} error={errors.specialization} />
            </div>
          </div>
        )}
        <PasswordRequirementsList className="mt-4" items={passwordRequirements} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{labels.cancel}</Button>
          <Button loading={loading} disabled={showDoctorFields && doctorDataLoading} onClick={onSubmit}>{labels.submit}</Button>
        </div>
      </div>
    </div>
  );
}
