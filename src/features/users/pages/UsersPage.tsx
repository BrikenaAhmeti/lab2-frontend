import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import { usersApi } from '@/lib/api/auth-api';

const roleOptions = ['Super Admin', 'Admin', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Receptionist', 'Patient'];

export default function UsersPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    roles: ['Patient'],
  });

  const usersQuery = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list(search),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.createUser(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', roles: ['Patient'] });
    },
  });

  const rows = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  return (
    <Card
      title={t('auth.usersTitle')}
      subtitle={t('auth.usersSubtitle')}
      actions={<Button onClick={() => setShowModal(true)}>{t('auth.addUser')}</Button>}
    >
      <div className="mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('auth.searchUsers')} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t('auth.firstName')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.lastName')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.email')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.roles')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3">{user.firstName}</td>
                <td className="px-4 py-3">{user.lastName}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => <Badge key={`${user.id}-${role}`}>{role}</Badge>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
          <div className="panel w-full max-w-lg p-5">
            <h3 className="text-lg font-semibold">{t('auth.addUser')}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input label={t('auth.firstName')} value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
              <Input label={t('auth.lastName')} value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
              <Input label={t('auth.email')} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <Input label={t('auth.password')} type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              <Input label={t('auth.phone')} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">{t('auth.roles')}</span>
                <select
                  value={form.roles[0]}
                  onChange={(e) => setForm((p) => ({ ...p, roles: [e.target.value] }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>{t('auth.cancel')}</Button>
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>{t('auth.createUser')}</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
