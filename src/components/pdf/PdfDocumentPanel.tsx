import clsx from 'clsx';
import { FileText, ShieldCheck } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

type PdfAccent = 'teal' | 'blue' | 'green' | 'amber' | 'rose';

export interface PdfInfoItem {
  label: string;
  value?: ReactNode;
}

interface PdfDocumentPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  documentLabel: string;
  brandName?: ReactNode;
  issuerDetails?: ReactNode[];
  subtitle?: ReactNode;
  meta?: PdfInfoItem[];
  actions?: ReactNode;
  status?: ReactNode;
  accent?: PdfAccent;
}

const accentClasses: Record<PdfAccent, string> = {
  teal: 'border-med-200/80 bg-med-50/80 text-med-800 dark:border-med-700/60 dark:bg-med-900/25 dark:text-med-100',
  blue: 'border-cobalt-200/80 bg-cobalt-50/80 text-cobalt-800 dark:border-cobalt-700/60 dark:bg-cobalt-900/25 dark:text-cobalt-100',
  green: 'border-success/25 bg-success/10 text-success',
  amber: 'border-warning/30 bg-warning/10 text-warning',
  rose: 'border-danger/25 bg-danger/10 text-danger',
};

const sectionAccentClasses: Record<PdfAccent, string> = {
  teal: 'bg-med-500',
  blue: 'bg-cobalt-500',
  green: 'bg-success',
  amber: 'bg-warning',
  rose: 'bg-danger',
};

function presentValue(value: ReactNode) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

export function PdfDocumentPanel({
  title,
  documentLabel,
  brandName = 'MedSphere',
  issuerDetails = [],
  subtitle,
  meta = [],
  actions,
  status,
  accent = 'teal',
  className,
  children,
  ...rest
}: PdfDocumentPanelProps) {
  return (
    <article className={clsx('overflow-hidden rounded-lg border border-border bg-card shadow-soft', className)} {...rest}>
      <div className="grid h-1.5 grid-cols-4" aria-hidden="true">
        <span className="bg-med-500" />
        <span className="bg-cobalt-500" />
        <span className="bg-accent" />
        <span className="bg-warning" />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-white p-1 shadow-sm dark:bg-surface">
              <img src="/medsphere.png" alt="" className="h-full w-full rounded-md object-cover" loading="lazy" decoding="async" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-primary">{brandName}</p>
              <h3 className="mt-1 break-words text-lg font-semibold text-foreground">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
              {issuerDetails.length > 0 ? (
                <div className="mt-2 space-y-0.5 text-xs leading-5 text-muted">
                  {issuerDetails.map((detail, index) => (
                    <p key={index}>{detail}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                accentClasses[accent]
              )}
            >
              <FileText size={14} aria-hidden="true" />
              {documentLabel}
            </span>
            {status ? <div>{status}</div> : null}
            {actions ? <div className="pt-1">{actions}</div> : null}
          </div>
        </div>

        {meta.length > 0 ? (
          <PdfInfoGrid items={meta} className="mt-4" columns="four" />
        ) : null}

        {children ? <div className="mt-4 space-y-4">{children}</div> : null}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted">
          <ShieldCheck size={14} className="text-success" aria-hidden="true" />
          <span>Prepared by MedSphere</span>
          <span className={clsx('h-1.5 w-1.5 rounded-full', sectionAccentClasses[accent])} aria-hidden="true" />
          <span>PDF-ready document</span>
        </div>
      </div>
    </article>
  );
}

export function PdfSection({
  title,
  accent = 'teal',
  className,
  children,
}: {
  title: ReactNode;
  accent?: PdfAccent;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <span className={clsx('h-5 w-1 rounded-full', sectionAccentClasses[accent])} aria-hidden="true" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </section>
  );
}

export function PdfInfoGrid({
  items,
  columns = 'two',
  className,
}: {
  items: PdfInfoItem[];
  columns?: 'two' | 'three' | 'four';
  className?: string;
}) {
  const columnsClass = {
    two: 'sm:grid-cols-2',
    three: 'sm:grid-cols-2 lg:grid-cols-3',
    four: 'sm:grid-cols-2 xl:grid-cols-4',
  }[columns];

  return (
    <dl className={clsx('grid gap-3', columnsClass, className)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border/80 bg-surface/50 p-3">
          <dt className="text-xs font-medium uppercase tracking-normal text-muted">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-foreground">{presentValue(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
