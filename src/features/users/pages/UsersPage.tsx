import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import UsersTable from '@/ui/organisms/users/UsersTable';
import CreateUserModal from '@/ui/organisms/users/CreateUserModal';
import { type CreateUserPayload, usersApi } from '@/lib/api/auth-api';
import { departmentsApi } from '@/lib/api/departments-api';
import { staffPositionTypesApi } from '@/lib/api/staff-position-types-api';
import { staffApi } from '@/lib/api/staff-api';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';

const roleOptions = ['Super Admin', 'Admin', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Receptionist', 'Patient'];
const doctorRole = 'Doctor';
const doctorStaffWarning = 'Doctor user was created, but staff profile creation failed.';
const doctorStaffPermissionWarning = 'Doctor user creation requires staff:manage permission to create the staff profile.';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  personalNumber: '',
  roles: ['Patient'],
  departmentId: '',
  staffPositionTypeId: '',
  employeeCode: '',
  specialization: '',
};

const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'auth.firstNameRequired'),
  lastName: z.string().trim().min(1, 'auth.lastNameRequired'),
  email: z.string().email('auth.emailValidationError'),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  personalNumber: z.string().trim().optional(),
  roles: z.array(z.string()).min(1, 'auth.roleRequired'),
  departmentId: z.string().trim().optional(),
  staffPositionTypeId: z.string().trim().optional(),
  employeeCode: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
}).superRefine((value, context) => {
  if (!value.roles.includes(doctorRole)) {
    return;
  }

  if (!value.departmentId) {
    context.addIssue({
      code: 'custom',
      path: ['departmentId'],
      message: 'Department is required for doctors.',
    });
  }

  if (!value.staffPositionTypeId) {
    context.addIssue({
      code: 'custom',
      path: ['staffPositionTypeId'],
      message: 'Staff position type is required for doctors.',
    });
  }

  if (!value.employeeCode?.trim()) {
    context.addIssue({
      code: 'custom',
      path: ['employeeCode'],
      message: 'Employee code is required for doctors.',
    });
  }
});

function getStatusCode(error: unknown) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ');
    }
  }

  return fallback;
}

function normalizeRoleKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export default function UsersPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const canManageUsers =
    hasAnyRole(roles, ['Admin', 'Super Admin']) ||
    hasAnyPermission(permissions, ['users:create', 'users:read'], 'any');
  const canManageStaff = hasAnyPermission(permissions, ['staff:manage'], 'all');

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [form, setForm] = useState(initialForm);
  const isDoctorUser = form.roles.includes(doctorRole);

  const validation = useMemo(() => createUserSchema.safeParse(form), [form]);

  const createUserPayload = (): CreateUserPayload => {
    const payload: CreateUserPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      roles: form.roles,
    };

    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.dateOfBirth.trim()) payload.dateOfBirth = form.dateOfBirth.trim();
    if (form.gender.trim()) payload.gender = form.gender.trim();
    if (form.personalNumber.trim()) payload.personalNumber = form.personalNumber.trim();

    return payload;
  };

  const fieldError = (field: keyof typeof form) => {
    if (validation.success) return '';
    const issue = validation.error.issues.find((item) => item.path[0] === field);
    if (!issue) return '';
    return issue.message.startsWith('auth.') ? t(issue.message) : issue.message;
  };

  const usersQuery = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list(search),
    retry: false,
    enabled: canManageUsers,
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments', 'active', 'user-doctor-create'],
    queryFn: () => departmentsApi.list({ page: 1, limit: 100, isActive: true }),
    enabled: canManageUsers && showModal && isDoctorUser,
    retry: false,
  });

  const staffPositionTypesQuery = useQuery({
    queryKey: ['staff-position-types', 'active', 'user-doctor-create'],
    queryFn: () => staffPositionTypesApi.list({ isActive: true }),
    enabled: canManageUsers && showModal && isDoctorUser,
    retry: false,
  });

  const doctorPositionTypeOptions = useMemo(
    () => (staffPositionTypesQuery.data?.items ?? []).filter((item) => normalizeRoleKey(item.defaultRoleKey) === 'doctor'),
    [staffPositionTypesQuery.data?.items],
  );
  const doctorPositionType = doctorPositionTypeOptions[0];

  useEffect(() => {
    if (!isDoctorUser || form.staffPositionTypeId || !doctorPositionType) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      staffPositionTypeId: prev.staffPositionTypeId || doctorPositionType.id,
    }));
  }, [doctorPositionType, form.staffPositionTypeId, isDoctorUser]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const created = await usersApi.createUser(createUserPayload());
      let staffProfileCreated = false;
      let staffProfileFailed = false;
      let staffProfileErrorMessage = '';

      if (form.roles.includes(doctorRole)) {
        try {
          await staffApi.create({
            userId: created.user.id,
            staffPositionTypeId: form.staffPositionTypeId.trim(),
            employeeCode: form.employeeCode.trim(),
            specialization: form.specialization.trim() || undefined,
            employmentStatus: 'ACTIVE',
            isPublicProfile: true,
            departments: [
              {
                departmentId: form.departmentId.trim(),
                isPrimary: true,
              },
            ],
          });
          staffProfileCreated = true;
        } catch (error) {
          console.error('Doctor staff profile creation failed', error);
          staffProfileFailed = true;
          staffProfileErrorMessage = getApiErrorMessage(error, doctorStaffWarning);
        }
      }

      return { created, staffProfileCreated, staffProfileFailed, staffProfileErrorMessage };
    },
    onSuccess: async ({ staffProfileCreated, staffProfileFailed, staffProfileErrorMessage }) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (staffProfileCreated) {
        await queryClient.invalidateQueries({ queryKey: ['staff'] });
        await queryClient.invalidateQueries({ queryKey: ['appointments', 'staff'] });
      }
      setFeedback({
        type: staffProfileFailed ? 'warning' : 'success',
        message: staffProfileFailed
          ? `${doctorStaffWarning} ${staffProfileErrorMessage}`
          : t('auth.userCreatedSuccess'),
      });
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (error) => {
      const status = getStatusCode(error);
      setFeedback({
        type: 'error',
        message: status === 403
          ? t('auth.forbiddenDescription')
          : getApiErrorMessage(error, t('auth.userCreateFailed')),
      });
    },
  });

  const rows = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const departmentOptions = useMemo(
    () => (departmentsQuery.data?.items ?? []).map((department) => ({
      value: department.id,
      label: department.name,
    })),
    [departmentsQuery.data?.items],
  );
  const staffPositionTypeOptions = useMemo(
    () => doctorPositionTypeOptions.map((positionType) => ({
      value: positionType.id,
      label: positionType.name,
    })),
    [doctorPositionTypeOptions],
  );

  if (!canManageUsers) {
    return <Forbidden />;
  }

  const usersStatus = getStatusCode(usersQuery.error);
  if (usersStatus === 403) {
    return <Forbidden />;
  }

  return (
    <Card
      title={t('auth.usersTitle')}
      subtitle={t('auth.usersSubtitle')}
      actions={<Button onClick={() => setShowModal(true)}>{t('auth.addUser')}</Button>}
    >
      <div className="mb-4 space-y-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('auth.searchUsers')} />
        {feedback && <FeedbackMessage type={feedback.type} message={feedback.message} />}
      </div>

      {usersQuery.isLoading && <p className="mb-4 text-sm text-muted">{t('loading')}</p>}
      {usersQuery.isError && !usersStatus && <p className="mb-4 text-sm text-danger">{t('auth.operationFailed')}</p>}

      <UsersTable
        labels={{
          firstName: t('auth.firstName'),
          lastName: t('auth.lastName'),
          email: t('auth.email'),
          roles: t('auth.roles'),
          empty: t('auth.noUsersFound'),
        }}
        rows={rows}
      />

      <CreateUserModal
        open={showModal}
        labels={{
          title: t('auth.createStaffAccount'),
          subtitle: t('auth.createStaffAccountSubtitle'),
          firstName: t('auth.firstName'),
          lastName: t('auth.lastName'),
          email: t('auth.email'),
          phone: t('auth.phone'),
          dateOfBirth: t('auth.dateOfBirth'),
          gender: t('auth.gender'),
          personalNumber: t('auth.personalNumber'),
          roles: t('auth.roles'),
          rolesHelp: t('auth.selectRolesHelp'),
          doctorDetails: 'Doctor details',
          departmentId: 'Department',
          staffPositionTypeId: 'Staff position type',
          employeeCode: 'Employee code',
          specialization: 'Specialization',
          loadingDoctorData: 'Loading doctor setup data...',
          doctorDataLoadFailed: 'Doctor setup data could not be loaded.',
          selectDepartment: 'Select department',
          selectStaffPositionType: 'Select staff position type',
          cancel: t('auth.cancel'),
          submit: t('auth.createUser'),
        }}
        roleOptions={roleOptions}
        departmentOptions={departmentOptions}
        staffPositionTypeOptions={staffPositionTypeOptions}
        values={form}
        errors={{
          firstName: fieldError('firstName'),
          lastName: fieldError('lastName'),
          email: fieldError('email'),
          roles: fieldError('roles'),
          departmentId: fieldError('departmentId'),
          staffPositionTypeId: fieldError('staffPositionTypeId'),
          employeeCode: fieldError('employeeCode'),
          specialization: fieldError('specialization'),
        }}
        loading={createMutation.isPending}
        doctorDataLoading={departmentsQuery.isLoading || staffPositionTypesQuery.isLoading}
        doctorDataError={departmentsQuery.isError || staffPositionTypesQuery.isError}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        onClose={() => setShowModal(false)}
        onSubmit={() => {
          setFeedback(null);
          if (isDoctorUser && !canManageStaff) {
            setFeedback({ type: 'error', message: doctorStaffPermissionWarning });
            return;
          }
          if (!validation.success) {
            setFeedback({ type: 'error', message: t('auth.fixFormErrors') });
            return;
          }
          createMutation.mutate();
        }}
      />
    </Card>
  );
}
