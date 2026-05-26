import type { BreadcrumbItem } from '@/ui/molecules/Breadcrumbs';

export function cmsBreadcrumbs(current: string): BreadcrumbItem[] {
  return [
    { label: 'Admin', to: '/admin' },
    { label: 'CMS', to: '/admin/cms/pages' },
    { label: current },
  ];
}
