import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { ServiceRecord } from '@/lib/api/services-api';
import type { StaffRecord } from '@/lib/api/staff-api';
import {
  formatOptionLabel,
  groupByOptions,
  reportFilterFields,
  reportTypeLabels,
  statusOptions,
  type ReportFilterState,
} from '@/features/reports/reportConfig';
import { reportTypes } from '@/lib/api/reports-api';
import { getStaffName } from '@/features/staff/hooks/useStaff';

interface ReportFiltersPanelProps {
  filters: ReportFilterState;
  departments: DepartmentRecord[];
  staff: StaffRecord[];
  services: ServiceRecord[];
  loading: boolean;
  onChange: (filters: Partial<ReportFilterState>) => void;
  onGenerate: () => void;
}

const selectClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function ReportFiltersPanel({
  filters,
  departments,
  staff,
  services,
  loading,
  onChange,
  onGenerate,
}: ReportFiltersPanelProps) {
  const fields = reportFilterFields[filters.reportType];
  const statuses = statusOptions[filters.reportType] ?? [];

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <label htmlFor="report-type" className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Report type</span>
          <select
            id="report-type"
            value={filters.reportType}
            onChange={(event) => onChange({ reportType: event.target.value as ReportFilterState['reportType'] })}
            className={selectClass}
          >
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {reportTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <Input
          id="report-from"
          label="From"
          type="date"
          value={filters.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
        <Input
          id="report-to"
          label="To"
          type="date"
          value={filters.to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <label htmlFor="report-group-by" className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Group by</span>
          <select
            id="report-group-by"
            value={filters.groupBy}
            onChange={(event) => onChange({ groupBy: event.target.value })}
            className={selectClass}
          >
            {groupByOptions[filters.reportType].map((group) => (
              <option key={group} value={group}>
                {formatOptionLabel(group)}
              </option>
            ))}
          </select>
        </label>

        {fields.department ? (
          <label htmlFor="report-department" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Department</span>
            <select
              id="report-department"
              value={filters.departmentId}
              onChange={(event) => onChange({ departmentId: event.target.value, staffProfileId: '', serviceCatalogId: '' })}
              className={selectClass}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {fields.staff ? (
          <label htmlFor="report-staff" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Staff</span>
            <select
              id="report-staff"
              value={filters.staffProfileId}
              onChange={(event) => onChange({ staffProfileId: event.target.value })}
              className={selectClass}
            >
              <option value="">All staff</option>
              {staff.map((item) => (
                <option key={item.id} value={item.id}>
                  {getStaffName(item)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {fields.service ? (
          <label htmlFor="report-service" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Service</span>
            <select
              id="report-service"
              value={filters.serviceCatalogId}
              onChange={(event) => onChange({ serviceCatalogId: event.target.value })}
              className={selectClass}
            >
              <option value="">All services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {fields.status ? (
          <label htmlFor="report-status" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Status</span>
            <select
              id="report-status"
              value={filters.status}
              onChange={(event) => onChange({ status: event.target.value })}
              className={selectClass}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatOptionLabel(status)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Generate
        </Button>
      </div>
    </form>
  );
}
