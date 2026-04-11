import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { profileApi } from '@/lib/api/auth-api';

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

  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.me(),
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

  const updateMutation = useMutation({
    mutationFn: () => profileApi.update(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      window.alert(t('auth.profileUpdated'));
    },
    onError: () => {
      window.alert(t('auth.operationFailed'));
    },
  });

  return (
    <Card title={t('auth.profileTitle')} subtitle={t('auth.profileSubtitle')}>
      {profileQuery.isLoading && <p className="text-sm text-muted">{t('loading')}</p>}
      {profileQuery.isError && <p className="text-sm text-danger">{t('auth.operationFailed')}</p>}
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate();
        }}
      >
        <Input label={t('auth.firstName')} value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
        <Input label={t('auth.lastName')} value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
        <Input label={t('auth.phone')} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <Input label={t('auth.dateOfBirth')} value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
        <Input label={t('auth.gender')} value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} />
        <Input label={t('auth.avatarFileId')} value={form.avatarFileId} onChange={(e) => setForm((p) => ({ ...p, avatarFileId: e.target.value }))} />
        <div className="md:col-span-2">
          <Button loading={updateMutation.isPending}>{t('auth.saveProfile')}</Button>
        </div>
      </form>
    </Card>
  );
}
