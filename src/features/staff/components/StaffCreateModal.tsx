import { useEffect, useState, type FormEvent } from 'react';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import SelectField from '@/ui/molecules/SelectField';
import TextareaField from '@/ui/molecules/TextareaField';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { StaffPositionTypeRecord } from '@/lib/api/staff-position-types-api';

export interface StaffCreateFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  personalNumber: string;
  staffPositionTypeId: string;
  employeeCode: string;
  specialization: string;
  licenseNumber: string;
  hireDate: string;
  bio: string;
  departmentIds: string[];
  isPublicProfile: boolean;
}

const emptyValues: StaffCreateFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  personalNumber: '',
  staffPositionTypeId: '',
  employeeCode: '',
  specialization: '',
  licenseNumber: '',
  hireDate: '',
  bio: '',
  departmentIds: [],
  isPublicProfile: false,
};

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

function isDoctorPosition(positionType?: StaffPositionTypeRecord) {
  const roleKey = positionType?.defaultRoleKey?.toLowerCase() ?? '';
  const name = positionType?.name?.toLowerCase() ?? '';

  return roleKey.includes('doctor') || name.includes('doctor') || name.includes('physician');
}

function validateStaff(values: StaffCreateFormValues) {
  const errors: Partial<Record<keyof StaffCreateFormValues, string>> = {};

  if (!values.firstName.trim()) errors.firstName = 'First name is required';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required';
  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email';
  }
  if (!values.staffPositionTypeId) errors.staffPositionTypeId = 'Position is required';
  if (!values.employeeCode.trim()) errors.employeeCode = 'Employee code is required';
  if (values.departmentIds.length === 0) errors.departmentIds = 'Choose at least one department';

  return errors;
}

export default function StaffCreateModal({
  open,
  loading,
  error,
  departments,
  positionTypes,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading?: boolean;
  error?: string;
  departments: DepartmentRecord[];
  positionTypes: StaffPositionTypeRecord[];
  onClose: () => void;
  onSubmit: (values: StaffCreateFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<StaffCreateFormValues>(emptyValues);
  const [localError, setLocalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues(emptyValues);
      setLocalError('');
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const fieldErrors = submitted ? validateStaff(values) : {};

  const update = <K extends keyof StaffCreateFormValues>(name: K, value: StaffCreateFormValues[K]) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const updatePositionType = (staffPositionTypeId: string) => {
    const selectedPositionType = positionTypes.find((positionType) => positionType.id === staffPositionTypeId);

    setValues((current) => ({
      ...current,
      staffPositionTypeId,
      isPublicProfile: isDoctorPosition(selectedPositionType) ? true : current.isPublicProfile,
    }));
  };

  const toggleDepartment = (departmentId: string) => {
    setValues((current) => {
      const selected = current.departmentIds.includes(departmentId);
      return {
        ...current,
        departmentIds: selected
          ? current.departmentIds.filter((id) => id !== departmentId)
          : [...current.departmentIds, departmentId],
      };
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setLocalError('');

    const errors = validateStaff(values);
    if (Object.keys(errors).length > 0) {
      setLocalError('Please complete the required staff details');
      return;
    }

    await onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <form noValidate onSubmit={submit} className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add staff member</h2>
            <p className="mt-1 text-sm text-muted">MedSphere will email the account password and confirmation link.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input
            id="staff-first-name"
            label="First name"
            value={values.firstName}
            required
            onChange={(event) => update('firstName', event.target.value)}
            error={fieldErrors.firstName}
            autoComplete="given-name"
          />
          <Input
            id="staff-last-name"
            label="Last name"
            value={values.lastName}
            required
            onChange={(event) => update('lastName', event.target.value)}
            error={fieldErrors.lastName}
            autoComplete="family-name"
          />
          <Input
            id="staff-email"
            label="Email"
            type="email"
            value={values.email}
            required
            onChange={(event) => update('email', event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />
          <Input
            id="staff-phone"
            label="Phone"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
          />
          <Input
            id="staff-date-of-birth"
            label="Date of birth"
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => update('dateOfBirth', event.target.value)}
            autoComplete="bday"
          />
          <SelectField
            id="staff-gender"
            label="Gender"
            value={values.gender}
            onChange={(event) => update('gender', event.target.value)}
          >
            <option value="">Not set</option>
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
          <Input
            id="staff-personal-number"
            label="Personal number"
            value={values.personalNumber}
            onChange={(event) => update('personalNumber', event.target.value)}
            autoComplete="off"
          />
          <SelectField
            id="staff-position-type"
            label="Position"
            value={values.staffPositionTypeId}
            required
            onChange={(event) => updatePositionType(event.target.value)}
            error={fieldErrors.staffPositionTypeId}
          >
            <option value="">Choose position</option>
            {positionTypes.map((positionType) => (
              <option key={positionType.id} value={positionType.id}>{positionType.name}</option>
            ))}
          </SelectField>
          <Input
            id="staff-employee-code"
            label="Employee code"
            value={values.employeeCode}
            required
            onChange={(event) => update('employeeCode', event.target.value)}
            error={fieldErrors.employeeCode}
          />
          <Input
            id="staff-specialization"
            label="Specialization"
            value={values.specialization}
            onChange={(event) => update('specialization', event.target.value)}
          />
          <Input
            id="staff-license-number"
            label="License number"
            value={values.licenseNumber}
            onChange={(event) => update('licenseNumber', event.target.value)}
          />
          <Input
            id="staff-hire-date"
            label="Hire date"
            type="date"
            value={values.hireDate}
            onChange={(event) => update('hireDate', event.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Departments</p>
          <div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-border bg-background p-3 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => (
              <label key={department.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-surface">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  checked={values.departmentIds.includes(department.id)}
                  onChange={() => toggleDepartment(department.id)}
                />
                <span>{department.name}</span>
              </label>
            ))}
          </div>
          {fieldErrors.departmentIds ? <p className="text-xs text-danger">{fieldErrors.departmentIds}</p> : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
          <TextareaField
            id="staff-bio"
            label="Bio"
            value={values.bio}
            rows={4}
            onChange={(event) => update('bio', event.target.value)}
          />
          <label htmlFor="staff-public-profile" className="flex items-center gap-3 self-start rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground">
            <input
              id="staff-public-profile"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              checked={values.isPublicProfile}
              onChange={(event) => update('isPublicProfile', event.target.checked)}
            />
            <span>Public doctor profile</span>
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {localError ? <FeedbackMessage type="error" message={localError} /> : null}
          {error ? <FeedbackMessage type="error" message={error} /> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add staff</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
