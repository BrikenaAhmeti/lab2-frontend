import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import { sessionsApi } from '@/lib/api/auth-api';
import { useAppSelector } from '@/app/hooks';

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default function SessionsPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const isAdmin = roles.includes('Admin') || roles.includes('Super Admin');

  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => sessionsApi.list(),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ sessionId, admin }: { sessionId: string; admin: boolean }) =>
      admin ? sessionsApi.adminRevoke(sessionId) : sessionsApi.revoke(sessionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });

  return (
    <Card title={t('auth.sessionsTitle')} subtitle={t('auth.sessionsSubtitle')}>
      {sessionsQuery.isLoading && <p className="text-sm text-muted">{t('loading')}</p>}
      {sessionsQuery.isError && <p className="text-sm text-danger">{t('auth.operationFailed')}</p>}
      <div className="space-y-3">
        {sessionsQuery.data?.map((session) => (
          <div key={session.id} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-foreground">{session.deviceInfo}</p>
            <p className="mt-1 text-xs text-muted">IP: {session.ipAddress}</p>
            <p className="mt-1 text-xs text-muted">{t('auth.createdAt')}: {formatDate(session.createdAt)}</p>
            <p className="mt-1 text-xs text-muted">{t('auth.lastUsedAt')}: {formatDate(session.lastUsedAt)}</p>
            <p className="mt-1 text-xs text-muted">{t('auth.expiresAt')}: {formatDate(session.expiresAt)}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="danger"
                loading={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate({ sessionId: session.id, admin: false })}
              >
                {t('auth.revoke')}
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={revokeMutation.isPending}
                  onClick={() => revokeMutation.mutate({ sessionId: session.id, admin: true })}
                >
                  {t('auth.adminRevoke')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
