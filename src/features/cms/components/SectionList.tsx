import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { CmsSection, CmsSectionOrderPayload } from '@/lib/api/cms-api';

interface SectionListProps {
  sections: CmsSection[];
  canManage: boolean;
  mutationPending: boolean;
  onEdit: (section: CmsSection) => void;
  onToggleVisibility: (section: CmsSection) => void;
  onDelete: (section: CmsSection) => void;
  onReorder: (sections: CmsSectionOrderPayload[]) => void;
}

function summary(section: CmsSection) {
  const text = section.body || section.subtitle || section.title || '';
  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
}

function orderedPayload(sections: CmsSection[]) {
  return sections.map((section, index) => ({
    id: section.id,
    sortOrder: index,
  }));
}

function moveSection(sections: CmsSection[], fromIndex: number, toIndex: number) {
  const next = [...sections];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function SectionList({
  sections,
  canManage,
  mutationPending,
  onEdit,
  onToggleVisibility,
  onDelete,
  onReorder,
}: SectionListProps) {
  const orderedSections = useMemo(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder), [sections]);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= orderedSections.length) {
      return;
    }

    onReorder(orderedPayload(moveSection(orderedSections, fromIndex, toIndex)));
  }, [onReorder, orderedSections]);

  return (
    <div className="space-y-3">
      {orderedSections.map((section, index) => (
        <article
          key={section.id}
          className="rounded-xl border border-border bg-background p-4"
          draggable={canManage && !mutationPending}
          onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const fromIndex = Number(event.dataTransfer.getData('text/plain'));
            if (!Number.isNaN(fromIndex)) {
              reorder(fromIndex, index);
            }
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted" />
                <Badge variant="info">{section.type}</Badge>
                <Badge variant={section.isVisible ? 'success' : 'neutral'}>
                  {section.isVisible ? 'Visible' : 'Hidden'}
                </Badge>
                <span className="text-xs text-muted">Order {section.sortOrder}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">{section.title || 'Untitled section'}</h3>
              {summary(section) ? <p className="mt-1 text-sm text-muted">{summary(section)}</p> : null}
            </div>

            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={index === 0 || mutationPending}
                  onClick={() => reorder(index, index - 1)}
                  aria-label={`Move ${section.title || section.type} up`}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={index === orderedSections.length - 1 || mutationPending}
                  onClick={() => reorder(index, index + 1)}
                  aria-label={`Move ${section.title || section.type} down`}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={mutationPending}
                  onClick={() => onToggleVisibility(section)}
                  aria-label={section.isVisible ? `Hide ${section.title || section.type}` : `Show ${section.title || section.type}`}
                  title={section.isVisible ? 'Hide section' : 'Show section'}
                >
                  {section.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onEdit(section)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => onDelete(section)}>
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export default memo(SectionList);
