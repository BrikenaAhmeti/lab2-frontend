import type { BreadcrumbItem } from '@/ui/molecules/Breadcrumbs';

export function organizationBreadcrumbs(pageName: string): BreadcrumbItem[] {
  return [
    { label: 'Admin', to: '/admin' },
    { label: 'Organization' },
    { label: pageName },
  ];
}
