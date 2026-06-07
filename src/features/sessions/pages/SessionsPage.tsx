import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import CalendarDateTimePicker from '@/ui/molecules/CalendarDateTimePicker';
import { sessionsApi, type SessionDto, type SessionLogDto, type SessionUserDto } from '@/lib/api/auth-api';
import { useAppSelector } from '@/app/hooks';
import { hasAnyRole } from '@/features/auth/utils/permission';
import { getUserRoleNames } from '@/features/auth/utils/roles';
import { VapiCallLogsPanel } from '@/features/vapi/pages/VapiCallLogsPage';

type SessionTab = 'sessions' | 'logs' | 'voice-ai';

const logActions = [
  'login.success',
  'login.failed',
  'logout',
  'token.refresh',
  'session.revoked',
  'session.revoked.admin',
  'password.changed',
  'password.reset.requested',
  'password.reset.completed',
  'email.verified',
  'email.verification.resent',
  'user.registered',
  'user.created.admin',
] as const;

function formatDate(date?: string | null) {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toTitle(value: string) {
  return value
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function userName(user?: SessionUserDto | null) {
  if (!user) return 'Unknown user';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || user.email;
}

function userDetail(user?: SessionUserDto | null) {
  if (!user) return '';
  return [user.username ? `@${user.username}` : '', user.email].filter(Boolean).join(' · ');
}

function formatDevice(deviceInfo?: string | null) {
  const value = deviceInfo?.trim();
  if (!value) return 'Unknown device';

  const lower = value.toLowerCase();
  const browser =
    lower.includes('edg/') ? 'Microsoft Edge' :
    lower.includes('chrome/') ? 'Chrome' :
    lower.includes('firefox/') ? 'Firefox' :
    lower.includes('safari/') ? 'Safari' :
    lower === 'node' || lower.includes('node') ? 'API client' :
    'Device';
  const os =
    lower.includes('mac os') ? 'macOS' :
    lower.includes('windows') ? 'Windows' :
    lower.includes('iphone') ? 'iPhone' :
    lower.includes('android') ? 'Android' :
    lower.includes('linux') ? 'Linux' :
    '';

  return os ? `${browser} on ${os}` : browser;
}

function formatIp(value?: string | null) {
  if (!value) return '-';
  return value.replace(/^::ffff:/, '');
}

function actionVariant(action: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (action.includes('failed')) return 'danger';
  if (action.includes('revoked') || action.includes('password')) return 'warning';
  if (action.includes('login.success') || action.includes('verified') || action.includes('created')) return 'success';
  if (action.includes('refresh') || action.includes('logout')) return 'info';
  return 'neutral';
}

function humanAction(action: string) {
  const labels: Record<string, string> = {
    'login.success': 'Login succeeded',
    'login.failed': 'Login failed',
    logout: 'Logged out',
    'token.refresh': 'Session refreshed',
    'session.revoked': 'Session revoked',
    'session.revoked.admin': 'Session revoked by admin',
    'password.changed': 'Password changed',
    'password.reset.requested': 'Password reset requested',
    'password.reset.completed': 'Password reset completed',
    'email.verified': 'Email verified',
    'email.verification.resent': 'Verification resent',
    'user.registered': 'User registered',
    'user.created.admin': 'User created by admin',
  };

  return labels[action] ?? toTitle(action);
}

function valueText(value: unknown) {
  if (value === null || value === undefined || value === '') return 'empty';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isRecord(value)) {
    const label = value.name ?? value.email ?? value.username ?? value.status ?? value.reason;
    if (typeof label === 'string' && label.trim()) return label;
  }
  return safeStringify(value);
}

function changedRows(log: SessionLogDto) {
  const oldValue = log.oldValue;
  const newValue = log.newValue;

  if (isRecord(oldValue) || isRecord(newValue)) {
    const before = isRecord(oldValue) ? oldValue : {};
    const after = isRecord(newValue) ? newValue : {};
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    return keys
      .filter((key) => safeStringify(before[key]) !== safeStringify(after[key]))
      .slice(0, 4)
      .map((key) => ({
        field: toTitle(key),
        before: valueText(before[key]),
        after: valueText(after[key]),
      }));
  }

  if (safeStringify(oldValue) !== safeStringify(newValue)) {
    return [{ field: 'Details', before: valueText(oldValue), after: valueText(newValue) }];
  }

  return [];
}

function localDateToIso(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function resolveSessionTab(tab: string | null, canSeeVoiceAiLogs: boolean): SessionTab {
  if (tab === 'logs') return 'logs';
  if (tab === 'voice-ai' && canSeeVoiceAiLogs) return 'voice-ai';
  return 'sessions';
}

function SessionOwner({ user }: { user?: SessionUserDto | null }) {
  return (
    <div>
      <p className="font-medium text-foreground">{userName(user)}</p>
      {userDetail(user) ? <p className="mt-1 break-all text-xs text-muted">{userDetail(user)}</p> : null}
    </div>
  );
}

function SessionCard({
  session,
  isAdmin,
  currentUserId,
  loading,
  onRevoke,
}: {
  session: SessionDto;
  isAdmin: boolean;
  currentUserId?: string;
  loading: boolean;
  onRevoke: (sessionId: string, admin: boolean) => void;
}) {
  const canSelfRevoke = !session.userId || session.userId === currentUserId;
  const fullDeviceInfo = session.deviceInfo?.trim();
  const deviceLabel = formatDevice(fullDeviceInfo);

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{deviceLabel}</p>
            {session.userId === currentUserId ? <Badge variant="info">Your session</Badge> : null}
          </div>
          {fullDeviceInfo && fullDeviceInfo !== deviceLabel ? (
            <p className="mt-1 break-words text-xs text-muted">{fullDeviceInfo}</p>
          ) : null}
          <dl className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
            <div><dt className="font-medium text-foreground">IP</dt><dd>{formatIp(session.ipAddress)}</dd></div>
            <div><dt className="font-medium text-foreground">Created</dt><dd>{formatDate(session.createdAt)}</dd></div>
            <div><dt className="font-medium text-foreground">Last used</dt><dd>{formatDate(session.lastUsedAt)}</dd></div>
            <div><dt className="font-medium text-foreground">Expires</dt><dd>{formatDate(session.expiresAt)}</dd></div>
          </dl>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase text-muted">User</p>
          <div className="mt-2"><SessionOwner user={session.user} /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {canSelfRevoke ? (
              <Button
                size="sm"
                variant="danger"
                loading={loading}
                onClick={() => onRevoke(session.id, false)}
              >
                Revoke
              </Button>
            ) : null}
            {isAdmin ? (
              <Button
                size="sm"
                variant="secondary"
                loading={loading}
                onClick={() => onRevoke(session.id, true)}
              >
                Admin revoke
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function LogCard({ log }: { log: SessionLogDto }) {
  const changes = changedRows(log);
  const attemptedIdentifier = isRecord(log.newValue) && typeof log.newValue.identifier === 'string'
    ? log.newValue.identifier
    : '';

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr_1fr]">
        <div>
          <Badge variant={actionVariant(log.action)}>{humanAction(log.action)}</Badge>
          <p className="mt-2 text-xs text-muted">{formatDate(log.createdAt)}</p>
          <p className="mt-1 text-xs text-muted">Entity: {toTitle(log.entity)}</p>
          {log.entityId ? <p className="mt-1 break-all text-xs text-muted">ID: {log.entityId}</p> : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Performed by</p>
          <div className="mt-2">
            <SessionOwner user={log.actor} />
            {!log.actor && attemptedIdentifier ? (
              <p className="mt-1 break-all text-xs text-muted">Attempted: {attemptedIdentifier}</p>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-muted">IP {formatIp(log.ipAddress)}</p>
          {log.userAgent ? <p className="mt-1 break-words text-xs text-muted">{formatDevice(log.userAgent)}</p> : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Details</p>
          <div className="mt-2 space-y-2">
            {changes.length > 0 ? changes.map((change) => (
              <div key={change.field} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                <p className="font-semibold text-foreground">{change.field}</p>
                <p className="mt-1 break-words text-muted">
                  {change.before} <span className="text-foreground">to</span> {change.after}
                </p>
              </div>
            )) : <p className="text-xs text-muted">No field changes recorded</p>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SessionsPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const roles = getUserRoleNames(user);
  const isAdmin = hasAnyRole(roles, ['Admin', 'Super Admin']);
  const isSuperAdmin = hasAnyRole(roles, ['Super Admin']);
  const activeTab = resolveSessionTab(searchParams.get('tab'), isSuperAdmin);
  const tabs = useMemo<Array<{ key: SessionTab; label: string }>>(() => {
    const visibleTabs: Array<{ key: SessionTab; label: string }> = [
      { key: 'sessions', label: 'Active sessions' },
      { key: 'logs', label: 'Logs' },
    ];

    if (isSuperAdmin) {
      visibleTabs.push({ key: 'voice-ai', label: 'Voice AI Logs' });
    }

    return visibleTabs;
  }, [isSuperAdmin]);
  const [filters, setFilters] = useState({
    userSearch: '',
    action: '',
    from: '',
    to: '',
    changed: '',
  });

  const logParams = useMemo(() => ({
    page: 1,
    limit: 50,
    userSearch: filters.userSearch || undefined,
    action: filters.action || undefined,
    changed: filters.changed || undefined,
    from: localDateToIso(filters.from),
    to: localDateToIso(filters.to),
  }), [filters]);

  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => sessionsApi.list(),
  });

  const logsQuery = useQuery({
    queryKey: ['auth', 'session-logs', logParams],
    queryFn: () => sessionsApi.logs(logParams),
    enabled: activeTab === 'logs',
  });

  const revokeMutation = useMutation({
    mutationFn: ({ sessionId, admin }: { sessionId: string; admin: boolean }) =>
      admin ? sessionsApi.adminRevoke(sessionId) : sessionsApi.revoke(sessionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['auth', 'session-logs'] }),
      ]);
    },
  });

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ userSearch: '', action: '', from: '', to: '', changed: '' });
  };

  const selectTab = (tab: SessionTab) => {
    const nextParams = new URLSearchParams(searchParams);

    if (tab === 'sessions') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('auth.sessionsTitle')}</h1>
        <p className="mt-1 text-sm text-muted">Monitor active devices and review security activity.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Session views">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => selectTab(tab.key)}
              className={clsx(
                'rounded-lg border px-3 py-2 text-sm font-medium transition',
                activeTab === tab.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'sessions' ? (
          <Card title="Active sessions" subtitle="Authenticated devices currently using MedSphere">
            {sessionsQuery.isLoading ? <p className="text-sm text-muted">{t('loading')}</p> : null}
            {sessionsQuery.isError ? <p className="text-sm text-danger">{t('auth.operationFailed')}</p> : null}
            {!sessionsQuery.isLoading && !sessionsQuery.isError && sessionsQuery.data?.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                No active sessions found.
              </p>
            ) : null}
            {sessionsQuery.data?.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isAdmin={isAdmin}
                currentUserId={user?.id}
                loading={revokeMutation.isPending}
                onRevoke={(sessionId, admin) => revokeMutation.mutate({ sessionId, admin })}
              />
            ))}
          </Card>
        ) : null}

        {activeTab === 'logs' ? (
          <Card title="Logs" subtitle="Search session and identity activity">
            <div className="grid gap-3 rounded-xl border border-border bg-surface/60 p-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-1 text-xs font-medium text-muted">
                User
                <input
                  value={filters.userSearch}
                  onChange={(event) => updateFilter('userSearch', event.target.value)}
                  placeholder="Name, username, email"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-1 text-xs font-medium text-muted">
                Action
                <select
                  value={filters.action}
                  onChange={(event) => updateFilter('action', event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All actions</option>
                  {logActions.map((action) => (
                    <option key={action} value={action}>{humanAction(action)}</option>
                  ))}
                </select>
              </label>
              <CalendarDateTimePicker label="From" id="session-log-from" value={filters.from} onChange={(value) => updateFilter('from', value)} />
              <CalendarDateTimePicker
                label="To"
                id="session-log-to"
                value={filters.to}
                defaultTime="23:59"
                onChange={(value) => updateFilter('to', value)}
              />
              <label className="space-y-1 text-xs font-medium text-muted">
                Change or detail
                <div className="flex gap-2">
                  <input
                    value={filters.changed}
                    onChange={(event) => updateFilter('changed', event.target.value)}
                    placeholder="IP, device, field"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>Clear</Button>
                </div>
              </label>
            </div>

            {logsQuery.isLoading ? <p className="text-sm text-muted">{t('loading')}</p> : null}
            {logsQuery.isError ? <p className="text-sm text-danger">{t('auth.operationFailed')}</p> : null}
            {!logsQuery.isLoading && !logsQuery.isError && logsQuery.data?.items.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                No logs match these filters.
              </p>
            ) : null}
            <div className="space-y-3">
              {logsQuery.data?.items.map((log) => <LogCard key={log.id} log={log} />)}
            </div>
            {logsQuery.data?.meta ? (
              <p className="text-xs text-muted">
                Showing {logsQuery.data.items.length} of {logsQuery.data.meta.total} log entries.
              </p>
            ) : null}
          </Card>
        ) : null}

        {activeTab === 'voice-ai' && isSuperAdmin ? (
          <VapiCallLogsPanel showHeader={false} />
        ) : null}
      </div>
    </div>
  );
}
