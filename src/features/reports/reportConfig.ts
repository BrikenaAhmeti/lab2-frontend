import type {
  ReportFilters,
  ReportRow,
  ReportRowValue,
  ReportTemplate,
  ReportType,
} from '@/lib/api/reports-api';

export interface ReportFilterState {
  reportType: ReportType;
  from: string;
  to: string;
  groupBy: string;
  departmentId: string;
  staffProfileId: string;
  serviceCatalogId: string;
  status: string;
}

export const reportTypeLabels: Record<ReportType, string> = {
  appointments: 'Appointments',
  clinical: 'Clinical',
  financial: 'Financial',
  inventory: 'Inventory',
  patients: 'Patients',
  'staff-workload': 'Staff Workload',
};

export const groupByOptions: Record<ReportType, string[]> = {
  appointments: ['status', 'department', 'doctor', 'service', 'day', 'hour'],
  clinical: ['category', 'department', 'doctor', 'labTest', 'medication', 'diagnosis', 'day'],
  financial: ['day', 'month', 'department', 'service', 'doctor', 'paymentMethod', 'status', 'aging'],
  inventory: ['category', 'department', 'item', 'transactionType', 'expiry'],
  patients: ['day', 'month', 'gender', 'bloodType', 'ageGroup', 'returning'],
  'staff-workload': ['doctor', 'department', 'day'],
};

export const defaultGroupBy: Record<ReportType, string> = {
  appointments: 'status',
  clinical: 'category',
  financial: 'day',
  inventory: 'category',
  patients: 'month',
  'staff-workload': 'doctor',
};

export const statusOptions: Partial<Record<ReportType, string[]>> = {
  appointments: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  clinical: ['PENDING', 'COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  financial: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE'],
  inventory: ['RECEIVED', 'DISPENSED', 'ADJUSTED', 'TRANSFERRED', 'WRITTEN_OFF'],
  'staff-workload': ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
};

export const reportFilterFields: Record<
  ReportType,
  { department: boolean; staff: boolean; service: boolean; status: boolean }
> = {
  appointments: { department: true, staff: true, service: true, status: true },
  clinical: { department: true, staff: true, service: true, status: true },
  financial: { department: true, staff: true, service: true, status: true },
  inventory: { department: true, staff: false, service: false, status: true },
  patients: { department: true, staff: true, service: true, status: false },
  'staff-workload': { department: true, staff: true, service: true, status: true },
};

export function createReportFilters(reportType: ReportType = 'appointments'): ReportFilterState {
  return {
    reportType,
    from: '',
    to: '',
    groupBy: defaultGroupBy[reportType],
    departmentId: '',
    staffProfileId: '',
    serviceCatalogId: '',
    status: '',
  };
}

export function dateRangeFromInput(value: string, edge: 'start' | 'end') {
  if (!value) return undefined;
  const suffix = edge === 'start' ? 'T00:00:00' : 'T23:59:59.999';
  return new Date(`${value}${suffix}`).toISOString();
}

export function toReportQueryFilters(filters: ReportFilterState): ReportFilters {
  const fields = reportFilterFields[filters.reportType];

  return {
    from: dateRangeFromInput(filters.from, 'start'),
    to: dateRangeFromInput(filters.to, 'end'),
    groupBy: filters.groupBy || defaultGroupBy[filters.reportType],
    departmentId: fields.department ? filters.departmentId || undefined : undefined,
    staffProfileId: fields.staff ? filters.staffProfileId || undefined : undefined,
    serviceCatalogId: fields.service ? filters.serviceCatalogId || undefined : undefined,
    status: fields.status ? filters.status || undefined : undefined,
  };
}

export function toTemplateParameters(filters: ReportFilterState) {
  const queryFilters = toReportQueryFilters(filters);

  return {
    from: queryFilters.from ?? null,
    to: queryFilters.to ?? null,
    groupBy: queryFilters.groupBy ?? defaultGroupBy[filters.reportType],
    departmentId: queryFilters.departmentId ?? null,
    staffProfileId: queryFilters.staffProfileId ?? null,
    serviceCatalogId: queryFilters.serviceCatalogId ?? null,
    status: queryFilters.status ?? null,
  };
}

function stringParam(parameters: Record<string, unknown>, key: string) {
  const value = parameters[key];
  return typeof value === 'string' ? value : '';
}

function dateParam(parameters: Record<string, unknown>, key: string) {
  const value = stringParam(parameters, key);
  return value ? value.slice(0, 10) : '';
}

export function filtersFromTemplate(template: ReportTemplate): ReportFilterState {
  const base = createReportFilters(template.reportType);
  const groupBy = stringParam(template.parameters, 'groupBy');

  return {
    ...base,
    from: dateParam(template.parameters, 'from'),
    to: dateParam(template.parameters, 'to'),
    groupBy: groupByOptions[template.reportType].includes(groupBy) ? groupBy : base.groupBy,
    departmentId: stringParam(template.parameters, 'departmentId'),
    staffProfileId: stringParam(template.parameters, 'staffProfileId'),
    serviceCatalogId: stringParam(template.parameters, 'serviceCatalogId'),
    status: stringParam(template.parameters, 'status'),
  };
}

export function formatOptionLabel(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatReportValue(value: ReportRowValue) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return new Intl.NumberFormat('en').format(value);
  return value;
}

export function tableColumns(rows: ReportRow[]) {
  return rows[0] ? Object.keys(rows[0]) : [];
}

export function firstNumericKey(rows: ReportRow[]) {
  const firstRow = rows[0];
  if (!firstRow) return '';
  return Object.keys(firstRow).find((key) => key !== 'group' && typeof firstRow[key] === 'number') ?? '';
}

export function chartKind(reportType: ReportType, groupBy: string) {
  if (reportType === 'patients' && ['gender', 'bloodType', 'returning'].includes(groupBy)) return 'pie';
  if (reportType === 'financial' && ['day', 'month'].includes(groupBy)) return 'line';
  return 'bar';
}

export function reportSnapshotRange(period: 'today' | 'week' | 'month') {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (period === 'week') {
    const day = from.getDay() || 7;
    from.setDate(from.getDate() - day + 1);
  }

  if (period === 'month') {
    from.setDate(1);
  }

  const to = new Date();
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
