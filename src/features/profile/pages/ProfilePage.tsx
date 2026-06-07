import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Forbidden from '@/components/common/Forbidden';
import Unauthorized from '@/components/common/Unauthorized';
import { authApi, profileApi } from '@/lib/api/auth-api';
import { passwordRequirementKeys, passwordSchema } from '@/features/auth/utils/password';
import ProfileDetailsForm from '@/ui/organisms/profile/ProfileDetailsForm';
import ChangePasswordForm from '@/ui/organisms/profile/ChangePasswordForm';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'auth.currentPasswordRequired'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'auth.passwordsMustMatch',
  });

function getStatusCode(error: unknown) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

export default function ProfilePage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    avatarFileId: '',
  });
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.me(),
    retry: false,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setForm({
      firstName: profileQuery.data.firstName ?? '',
      lastName: profileQuery.data.lastName ?? '',
      phone: profileQuery.data.phone ?? '',
      dateOfBirth: profileQuery.data.dateOfBirth ?? '',
      gender: profileQuery.data.gender ?? '',
      avatarFileId: profileQuery.data.avatarFileId ?? '',
    });
  }, [profileQuery.data]);

  const passwordValidation = useMemo(
    () => changePasswordSchema.safeParse(changePasswordForm),
    [changePasswordForm]
  );

  const passwordFieldError = (field: 'currentPassword' | 'newPassword' | 'confirmNewPassword') => {
    if (passwordValidation.success) return '';
    const issue = passwordValidation.error.issues.find((item) => item.path[0] === field);
    return issue ? t(issue.message) : '';
  };

  const updateMutation = useMutation({
    mutationFn: () => profileApi.update(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setProfileFeedback({ type: 'success', message: t('auth.profileUpdated') });
    },
    onError: (error) => {
      const status = getStatusCode(error);
      setProfileFeedback({
        type: 'error',
        message:
          status === 403
            ? t('auth.forbiddenDescription')
            : status === 401
              ? t('auth.unauthorizedDescription')
              : t('auth.operationFailed'),
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      }),
    onSuccess: () => {
      setPasswordFeedback({
        type: 'success',
        message: `${t('auth.changePasswordSuccess')} ${t('auth.otherSessionsSignedOut')}`,
      });
      setChangePasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    },
    onError: (error) => {
      const status = getStatusCode(error);
      setPasswordFeedback({
        type: 'error',
        message:
          status === 403
            ? t('auth.forbiddenDescription')
            : status === 401
              ? t('auth.changePasswordUnauthorized')
              : t('auth.changePasswordFailed'),
      });
    },
  });

  const profileStatus = getStatusCode(profileQuery.error);
  if (profileStatus === 401) return <Unauthorized />;
  if (profileStatus === 403) return <Forbidden />;

  return (
    <div className="space-y-6">
      <Card title={t('auth.profileTitle')} subtitle={t('auth.profileSubtitle')}>
        {profileQuery.isLoading && <p className="text-sm text-muted">{t('loading')}</p>}
        {profileQuery.isError && !profileStatus && <p className="text-sm text-danger">{t('auth.operationFailed')}</p>}
        <ProfileDetailsForm
          labels={{
            firstName: t('auth.firstName'),
            lastName: t('auth.lastName'),
            phone: t('auth.phone'),
            dateOfBirth: t('auth.dateOfBirth'),
            gender: t('auth.gender'),
            selectGender: t('auth.selectGender'),
            genderFemale: t('auth.genderFemale'),
            genderMale: t('auth.genderMale'),
            genderOther: t('auth.genderOther'),
            avatarFileId: t('auth.avatarFileId'),
            saveProfile: t('auth.saveProfile'),
          }}
          form={form}
          loading={updateMutation.isPending}
          feedback={profileFeedback}
          onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={() => {
            setProfileFeedback(null);
            updateMutation.mutate();
          }}
        />
      </Card>

      <Card title={t('auth.changePasswordTitle')} subtitle={t('auth.changePasswordSubtitle')}>
        <ChangePasswordForm
          labels={{
            currentPassword: t('auth.currentPassword'),
            newPassword: t('auth.newPassword'),
            confirmNewPassword: t('auth.confirmNewPassword'),
            changePassword: t('auth.changePassword'),
          }}
          values={changePasswordForm}
          errors={{
            currentPassword: passwordFieldError('currentPassword'),
            newPassword: passwordFieldError('newPassword'),
            confirmNewPassword: passwordFieldError('confirmNewPassword'),
          }}
          requirements={passwordRequirementKeys.map((key) => t(key))}
          loading={changePasswordMutation.isPending}
          feedback={passwordFeedback}
          onChange={(field, value) => setChangePasswordForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={() => {
            setPasswordFeedback(null);

            if (!passwordValidation.success) {
              setPasswordFeedback({ type: 'error', message: t('auth.fixFormErrors') });
              return;
            }

            changePasswordMutation.mutate();
          }}
        />
      </Card>
    </div>
  );
}
