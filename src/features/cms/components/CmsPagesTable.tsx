import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { CmsPage } from '@/lib/api/cms-api';

interface CmsPagesTableProps {
  pages: CmsPage[];
  canManage: boolean;
  mutationPending: boolean;
  onTogglePublish: (page: CmsPage) => void;
  onDelete: (page: CmsPage) => void;
}

export default function CmsPagesTable({
  pages,
  canManage,
  mutationPending,
  onTogglePublish,
  onDelete,
}: CmsPagesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Sections</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <Link to={`/admin/cms/pages/${page.id}`} className="font-medium text-foreground hover:text-primary">
                  {page.title}
                </Link>
                {page.metaDescription ? <p className="mt-1 text-xs text-muted">{page.metaDescription}</p> : null}
              </td>
              <td className="px-4 py-3 text-muted">{page.slug}</td>
              <td className="px-4 py-3">
                <Badge variant={page.isPublished ? 'success' : 'neutral'}>
                  {page.isPublished ? 'Published' : 'Unpublished'}
                </Badge>
              </td>
              <td className="px-4 py-3">{page.sections?.length ?? 0}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/cms/pages/${page.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface/80"
                  >
                    Edit
                  </Link>
                  {canManage ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={mutationPending}
                        onClick={() => onTogglePublish(page)}
                      >
                        {page.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => onDelete(page)}>
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
