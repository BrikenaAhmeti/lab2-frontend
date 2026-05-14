import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.to && !isLast ? (
                <Link to={item.to} className="font-medium text-foreground hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-foreground' : ''}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden="true">&gt;</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
