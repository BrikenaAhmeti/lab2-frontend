import { memo } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { CmsBanner } from '@/lib/api/cms-api';
import { formatDateTime, getBannerScheduleStatus } from '@/features/cms/hooks/useCms';

interface BannersTableProps {
  banners: CmsBanner[];
  canManage: boolean;
  mutationPending: boolean;
  onEdit: (banner: CmsBanner) => void;
  onToggleActive: (banner: CmsBanner) => void;
  onDelete: (banner: CmsBanner) => void;
}

function BannersTable({
  banners,
  canManage,
  mutationPending,
  onEdit,
  onToggleActive,
  onDelete,
}: BannersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Banner</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Start</th>
            <th className="px-4 py-3 font-medium">End</th>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => {
            const status = getBannerScheduleStatus(banner);

            return (
              <tr key={banner.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{banner.title}</p>
                  <p className="mt-1 text-xs text-muted">{banner.message}</p>
                  {banner.linkUrl ? <p className="mt-1 text-xs text-primary">{banner.linkUrl}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-4 py-3">{formatDateTime(banner.startDate)}</td>
                <td className="px-4 py-3">{formatDateTime(banner.endDate)}</td>
                <td className="px-4 py-3">{banner.sortOrder}</td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onEdit(banner)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onToggleActive(banner)}>
                        {banner.isActive ? 'Pause' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => onDelete(banner)}>
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Read only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(BannersTable);
