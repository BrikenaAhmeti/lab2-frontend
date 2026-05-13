import Input from '@/ui/atoms/Input';
import type { DepartmentRecord } from '@/lib/api/departments-api';

interface ServiceCatalogFiltersProps {
  search: string;
  departmentId: string;
  isActive: 'all' | 'active' | 'inactive';
  departments: DepartmentRecord[];
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
}

export default function ServiceCatalogFilters({
  search,
  departmentId,
  isActive,
  departments,
  onSearchChange,
  onDepartmentChange,
  onStatusChange,
}: ServiceCatalogFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
      <Input
        id="service-catalog-search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search services"
      />
      <label htmlFor="service-catalog-department" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Department</span>
        <select
          id="service-catalog-department"
          value={departmentId}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="service-catalog-status" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Active status</span>
        <select
          id="service-catalog-status"
          value={isActive}
          onChange={(event) => onStatusChange(event.target.value as 'all' | 'active' | 'inactive')}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
    </div>
  );
}
