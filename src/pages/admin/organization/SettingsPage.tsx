import { useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import {
  formatSettingValue,
  getSettingsErrorMessage,
  parseSettingValue,
  useSettings,
  useUpdateSetting,
} from '@/features/settings/hooks/useSettings';
import type { SettingRecord } from '@/lib/api/settings-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { organizationBreadcrumbs } from './organizationBreadcrumbs';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

function settingLabel(setting: SettingRecord) {
  return setting.label ?? setting.key.replaceAll('_', ' ');
}

function settingDrafts(groups: { settings: SettingRecord[] }[]) {
  return Object.fromEntries(
    groups.flatMap((group) => group.settings.map((setting) => [setting.key, formatSettingValue(setting.value)]))
  );
}

export default function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const canManage = hasAnyRole(roles, ['Super Admin']) || hasAnyPermission(permissions, ['settings:manage', 'settings:manage:all'], 'any');

  const settingsQuery = useSettings(canManage);
  const updateMutation = useUpdateSetting();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const groups = settingsQuery.data ?? [];

  useEffect(() => {
    if (settingsQuery.data) {
      setDrafts(settingDrafts(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  if (!canManage) {
    return <Forbidden />;
  }

  const saveSetting = async (setting: SettingRecord) => {
    setFeedback(null);

    try {
      const value = parseSettingValue(drafts[setting.key] ?? '', setting.value);
      await updateMutation.mutateAsync({ key: setting.key, value });
      setEditingKey(null);
      setFeedback({ type: 'success', message: 'Setting saved successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: getSettingsErrorMessage(error, 'Setting could not be saved') });
    }
  };

  const cancelEdit = (setting: SettingRecord) => {
    setDrafts((current) => ({ ...current, [setting.key]: formatSettingValue(setting.value) }));
    setEditingKey(null);
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={organizationBreadcrumbs('Settings')} />

      <Card title="Settings" subtitle="Manage facility, scheduling, notification, and policy settings">
        <div className="space-y-4">
          {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

          {settingsQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-10 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
              </div>
            </div>
          ) : null}

          {settingsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getSettingsErrorMessage(settingsQuery.error, 'Settings could not be loaded')}
            />
          ) : null}

          {!settingsQuery.isLoading && !settingsQuery.isError && groups.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
              <p className="font-medium text-foreground">No settings found</p>
              <p className="mt-1 text-sm text-muted">Seed default settings in the Core Service before editing them here.</p>
            </div>
          ) : null}

          {!settingsQuery.isLoading && !settingsQuery.isError && groups.length > 0 ? (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-surface text-left text-xs uppercase text-muted">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Setting</th>
                          <th className="px-4 py-3 font-semibold">Value</th>
                          <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {group.settings.map((setting) => {
                          const isEditing = editingKey === setting.key;
                          const isJson = Boolean(setting.value && typeof setting.value === 'object');

                          return (
                            <tr key={setting.key}>
                              <td className="px-4 py-3 align-top">
                                <p className="font-medium capitalize text-foreground">{settingLabel(setting)}</p>
                                {setting.description ? <p className="mt-1 text-xs text-muted">{setting.description}</p> : null}
                              </td>
                              <td className="px-4 py-3 align-top">
                                {isEditing ? (
                                  isJson ? (
                                    <textarea
                                      value={drafts[setting.key] ?? ''}
                                      onChange={(event) =>
                                        setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))
                                      }
                                      className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                  ) : typeof setting.value === 'boolean' ? (
                                    <select
                                      value={drafts[setting.key] ?? 'false'}
                                      onChange={(event) =>
                                        setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))
                                      }
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    >
                                      <option value="true">Enabled</option>
                                      <option value="false">Disabled</option>
                                    </select>
                                  ) : (
                                    <input
                                      value={drafts[setting.key] ?? ''}
                                      type={typeof setting.value === 'number' ? 'number' : 'text'}
                                      onChange={(event) =>
                                        setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))
                                      }
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                  )
                                ) : (
                                  <p className="whitespace-pre-wrap text-foreground">{formatSettingValue(setting.value) || '-'}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex justify-end gap-2">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="sm"
                                        loading={updateMutation.isPending}
                                        onClick={() => saveSetting(setting)}
                                      >
                                        Save
                                      </Button>
                                      <Button variant="secondary" size="sm" onClick={() => cancelEdit(setting)}>
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <Button variant="secondary" size="sm" onClick={() => setEditingKey(setting.key)}>
                                      Edit
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
