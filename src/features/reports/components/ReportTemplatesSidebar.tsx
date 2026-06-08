import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import type { ReportTemplate } from '@/lib/api/reports-api';
import { reportTypeLabels } from '@/features/reports/reportConfig';

interface ReportTemplatesSidebarProps {
  templates: ReportTemplate[];
  loading: boolean;
  onLoad: (template: ReportTemplate) => void;
}

function formatTemplateDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export default function ReportTemplatesSidebar({ templates, loading, onLoad }: ReportTemplatesSidebarProps) {
  return (
    <aside className="panel p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Saved Report Templates</h3>
      </div>

      {loading ? <p className="rounded-xl border border-border p-4 text-sm text-muted">Loading templates...</p> : null}

      {!loading && templates.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted">No templates saved.</p>
      ) : null}

      {!loading && templates.length > 0 ? (
        <div className="space-y-3">
          {templates.map((template) => (
            <article key={template.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-foreground">{template.name}</h4>
                  <p className="mt-1 text-xs text-muted">{formatTemplateDate(template.updatedAt)}</p>
                </div>
                <Badge>{reportTypeLabels[template.reportType]}</Badge>
              </div>
              {template.description ? <p className="mt-3 text-sm text-muted">{template.description}</p> : null}
              <Button type="button" size="sm" variant="secondary" className="mt-4 w-full" onClick={() => onLoad(template)}>
                Use template
              </Button>
            </article>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
