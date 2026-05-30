import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { InventoryCategory } from '@/lib/api/inventory-api';
import type { ActiveStatus } from '@/features/inventory/inventory.schemas';
import Input from '@/ui/atoms/Input';

interface InventoryFiltersProps {
  search: string;
  categoryId: string;
  departmentId: string;
  belowReorderLevel: boolean;
  expiringSoonDays: string;
  isActive: ActiveStatus;
  categories: InventoryCategory[];
  departments: DepartmentRecord[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onBelowReorderLevelChange: (value: boolean) => void;
  onExpiringSoonDaysChange: (value: string) => void;
  onStatusChange: (value: ActiveStatus) => void;
}

const selectClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function InventoryFilters({
  search,
  categoryId,
  departmentId,
  belowReorderLevel,
  expiringSoonDays,
  isActive,
  categories,
  departments,
  onSearchChange,
  onCategoryChange,
  onDepartmentChange,
  onBelowReorderLevelChange,
  onExpiringSoonDaysChange,
  onStatusChange,
}: InventoryFiltersProps) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_150px_150px_160px]">
      <Input
        id="inventory-search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search name or SKU"
      />
      <label htmlFor="inventory-category-filter" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Category</span>
        <select id="inventory-category-filter" value={categoryId} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="inventory-department-filter" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Department</span>
        <select id="inventory-department-filter" value={departmentId} onChange={(event) => onDepartmentChange(event.target.value)} className={selectClass}>
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="inventory-expiring-soon" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Expiring</span>
        <input
          id="inventory-expiring-soon"
          type="number"
          min={1}
          max={365}
          value={expiringSoonDays}
          onChange={(event) => onExpiringSoonDaysChange(event.target.value)}
          placeholder="Days"
          className={selectClass}
        />
      </label>
      <label htmlFor="inventory-active-filter" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Active</span>
        <select id="inventory-active-filter" value={isActive} onChange={(event) => onStatusChange(event.target.value as ActiveStatus)} className={selectClass}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label className="flex items-center gap-2 self-end rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          checked={belowReorderLevel}
          onChange={(event) => onBelowReorderLevelChange(event.target.checked)}
        />
        Below reorder
      </label>
    </div>
  );
}
