import { AxiosError } from 'axios';
import { useMemo, useState } from 'react';
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
import { filterProtectedAdminRoles, isSuperAdmin } from '@/features/auth/utils/adminAccess';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';

const roleOptions = ['Super Admin', 'Admin', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Receptionist', 'Patient'];

const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'auth.firstNameRequired'),
  lastName: z.string().trim().min(1, 'auth.lastNameRequired'),
  email: z.string().email('auth.emailValidationError'),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  personalNumber: z.string().trim().optional(),
  roles: z.array(z.string()).min(1, 'auth.roleRequired'),
});

function getStatusCode(error: unknown) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

export default function UsersPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const canReadUsers =
    hasAnyRole(roles, ['Admin', 'Super Admin']) ||
    hasAnyPermission(permissions, ['users:create', 'users:read'], 'any');
  const canCreateUsers =
    hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['users:create'], 'any');
  const canCreateProtectedAdminUsers = isSuperAdmin(roles);
  const availableRoleOptions = useMemo(
    () => filterProtectedAdminRoles(roleOptions, canCreateProtectedAdminUsers),
    [canCreateProtectedAdminUsers]
  );

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    personalNumber: '',
    roles: ['Patient'],
  });

  const selectedRoles = useMemo(
    () => filterProtectedAdminRoles(form.roles, canCreateProtectedAdminUsers),
    [canCreateProtectedAdminUsers, form.roles]
  );
  const validation = useMemo(() => createUserSchema.safeParse({ ...form, roles: selectedRoles }), [form, selectedRoles]);

  const createUserPayload = (): CreateUserPayload => {
    const payload: CreateUserPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      roles: selectedRoles,
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
    return issue ? t(issue.message) : '';
  };

  const usersQuery = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list(search),
    retry: false,
    enabled: canReadUsers,
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.createUser(createUserPayload()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({ type: 'success', message: t('auth.userCreatedSuccess') });
      setShowModal(false);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        personalNumber: '',
        roles: ['Patient'],
      });
    },
    onError: (error) => {
      const status = getStatusCode(error);
      setFeedback({
        type: 'error',
        message: status === 403 ? t('auth.forbiddenDescription') : t('auth.userCreateFailed'),
      });
    },
  });

  const rows = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  if (!canReadUsers) {
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
      actions={canCreateUsers ? <Button onClick={() => setShowModal(true)}>{t('auth.addUser')}</Button> : null}
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
          cancel: t('auth.cancel'),
          submit: t('auth.createUser'),
        }}
        roleOptions={availableRoleOptions}
        values={{ ...form, roles: selectedRoles }}
        errors={{
          firstName: fieldError('firstName'),
          lastName: fieldError('lastName'),
          email: fieldError('email'),
          roles: fieldError('roles'),
        }}
        loading={createMutation.isPending}
        onChange={(field, value) => {
          setForm((prev) => ({
            ...prev,
            [field]: field === 'roles' && Array.isArray(value)
              ? filterProtectedAdminRoles(value, canCreateProtectedAdminUsers)
              : value,
          }));
        }}
        onClose={() => setShowModal(false)}
        onSubmit={() => {
          setFeedback(null);
          if (!canCreateUsers) {
            setFeedback({ type: 'error', message: t('auth.forbiddenDescription') });
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
