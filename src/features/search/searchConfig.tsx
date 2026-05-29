import Badge from '@/ui/atoms/Badge';
import type { SearchFilterField } from '@/ui/molecules/SearchFilterBar';
import type { SearchColumn } from '@/features/search/components/SearchResultsTable';
import { bloodTypeOptions, formatDate, formatDateTime, formatEnum } from '@/features/patients/components/patientFormat';
import type {
  AppointmentSearchItem,
  AuditLogSearchItem,
  InventoryItemSearchItem,
  LabOrderSearchItem,
  PatientSearchItem,
  SearchResource,
  StaffSearchItem,
} from '@/lib/api/search-api';

export interface SearchResourceConfig {
  resource: SearchResource;
  title: string;
  subtitle: string;
  permission: string;
  searchPlaceholder: string;
  emptyText: string;
  filters: SearchFilterField[];
  columns: Array<SearchColumn<unknown>>;
}

function titleEnum(value?: string | null) {
  const formatted = formatEnum(value);
  if (formatted === '-') return formatted;
  return formatted.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fallback(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function bloodTypeLabel(value?: string | null) {
  return bloodTypeOptions.find((option) => option.value === value)?.label ?? '-';
}

function statusVariant(value?: string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const normalized = value?.toLowerCase();

  if (['active', 'completed', 'confirmed', 'in_stock', 'reviewed'].includes(normalized ?? '')) return 'success';
  if (['pending', 'scheduled', 'collected', 'in_progress', 'checked_in', 'low', 'on_leave'].includes(normalized ?? '')) return 'warning';
  if (['cancelled', 'no_show', 'out_of_stock', 'terminated', 'critical', 'inactive'].includes(normalized ?? '')) return 'danger';
  if (normalized === 'true') return 'danger';
  if (normalized === 'false') return 'success';

  return 'neutral';
}

function enumBadge(value?: string | boolean | null) {
  if (value === null || value === undefined || value === '') return <span className="text-muted">-</span>;
  const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : titleEnum(value);
  return <Badge variant={statusVariant(String(value))}>{text}</Badge>;
}

function detailBlock(title: string, detail?: string | null) {
  return (
    <div>
      <p className="font-medium text-foreground">{fallback(title)}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}

function dateCell(value?: string | null, withTime = true) {
  return <span className="whitespace-nowrap">{withTime ? formatDateTime(value) : formatDate(value)}</span>;
}

function patient(row: unknown) {
  return row as PatientSearchItem;
}

function appointment(row: unknown) {
  return row as AppointmentSearchItem;
}

function labOrder(row: unknown) {
  return row as LabOrderSearchItem;
}

function inventoryItem(row: unknown) {
  return row as InventoryItemSearchItem;
}

function staff(row: unknown) {
  return row as StaffSearchItem;
}

function auditLog(row: unknown) {
  return row as AuditLogSearchItem;
}

function options(values: string[]) {
  return values.map((value) => ({ value, label: titleEnum(value) }));
}

const appointmentStatuses = [
  'SCHEDULED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

const labOrderStatuses = ['PENDING', 'COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const staffStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
const stockLevels = ['out_of_stock', 'low', 'in_stock'];

export const searchResourceConfigs: SearchResourceConfig[] = [
  {
    resource: 'patients',
    title: 'Patients',
    subtitle: 'Find patient profiles by name, email, phone, age, gender, or blood type.',
    permission: 'patients:read',
    searchPlaceholder: 'Search patients by name, email, phone, or personal number',
    emptyText: 'No patients match these filters.',
    filters: [
      { name: 'gender', label: 'Gender', placeholder: 'Any gender' },
      { name: 'minAge', label: 'Min age', type: 'number', min: 0, max: 130 },
      { name: 'maxAge', label: 'Max age', type: 'number', min: 0, max: 130 },
      {
        name: 'bloodType',
        label: 'Blood type',
        type: 'select',
        placeholder: 'All blood types',
        options: bloodTypeOptions.map((option) => ({ value: option.value, label: option.label })),
      },
    ],
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortBy: 'lastName',
        render: (row) => {
          const item = patient(row);
          return detailBlock(`${item.firstName} ${item.lastName}`, item.phone);
        },
      },
      { key: 'email', label: 'Email', sortBy: 'email', render: (row) => fallback(patient(row).email) },
      { key: 'age', label: 'Age', sortBy: 'age', render: (row) => fallback(patient(row).age) },
      { key: 'gender', label: 'Gender', render: (row) => titleEnum(patient(row).gender) },
      { key: 'bloodType', label: 'Blood type', render: (row) => bloodTypeLabel(patient(row).bloodType) },
      { key: 'status', label: 'Status', render: (row) => enumBadge(patient(row).isActive ? 'ACTIVE' : 'INACTIVE') },
      { key: 'createdAt', label: 'Created', sortBy: 'createdAt', render: (row) => dateCell(patient(row).createdAt) },
    ],
  },
  {
    resource: 'appointments',
    title: 'Appointments',
    subtitle: 'Search appointment bookings by patient, staff, status, department, and service.',
    permission: 'appointments:read',
    searchPlaceholder: 'Search appointments by patient or staff',
    emptyText: 'No appointments match these filters.',
    filters: [
      { name: 'status', label: 'Status', type: 'select', placeholder: 'All statuses', options: options(appointmentStatuses) },
      { name: 'from', label: 'From', type: 'date' },
      { name: 'to', label: 'To', type: 'date' },
      { name: 'departmentId', label: 'Department ID', placeholder: 'Department UUID' },
      { name: 'serviceCatalogId', label: 'Service ID', placeholder: 'Service UUID' },
    ],
    columns: [
      {
        key: 'patient',
        label: 'Patient',
        sortBy: 'patientName',
        render: (row) => {
          const item = appointment(row);
          return detailBlock(item.patient.name, item.patient.email ?? item.patient.phone);
        },
      },
      {
        key: 'staff',
        label: 'Staff',
        sortBy: 'staffName',
        render: (row) => {
          const item = appointment(row);
          return item.staff ? detailBlock(item.staff.displayName, item.staff.specialization) : '-';
        },
      },
      { key: 'status', label: 'Status', sortBy: 'status', render: (row) => enumBadge(appointment(row).status) },
      { key: 'scheduledAt', label: 'Scheduled', sortBy: 'scheduledAt', render: (row) => dateCell(appointment(row).scheduledAt) },
      { key: 'department', label: 'Department', sortBy: 'department', render: (row) => appointment(row).department.name },
      { key: 'service', label: 'Service', sortBy: 'service', render: (row) => appointment(row).service.name },
    ],
  },
  {
    resource: 'lab-orders',
    title: 'Lab Orders',
    subtitle: 'Find lab orders by patient, doctor, status, priority, date, and critical result flag.',
    permission: 'lab_orders:read',
    searchPlaceholder: 'Search lab orders by patient or doctor',
    emptyText: 'No lab orders match these filters.',
    filters: [
      { name: 'status', label: 'Status', type: 'select', placeholder: 'All statuses', options: options(labOrderStatuses) },
      { name: 'priority', label: 'Priority', placeholder: 'normal or urgent' },
      { name: 'from', label: 'From', type: 'date' },
      { name: 'to', label: 'To', type: 'date' },
      {
        name: 'hasCritical',
        label: 'Critical',
        type: 'select',
        placeholder: 'Any result',
        options: [
          { value: 'true', label: 'Has critical' },
          { value: 'false', label: 'No critical' },
        ],
      },
    ],
    columns: [
      {
        key: 'patient',
        label: 'Patient',
        sortBy: 'patientName',
        render: (row) => {
          const item = labOrder(row);
          return detailBlock(item.patient.name, item.patient.email ?? item.patient.phone);
        },
      },
      { key: 'doctor', label: 'Doctor', sortBy: 'doctor', render: (row) => labOrder(row).orderedByStaff.displayName },
      { key: 'status', label: 'Status', sortBy: 'status', render: (row) => enumBadge(labOrder(row).status) },
      { key: 'priority', label: 'Priority', sortBy: 'priority', render: (row) => enumBadge(labOrder(row).priority) },
      { key: 'tests', label: 'Tests', render: (row) => fallback(labOrder(row).testCount) },
      { key: 'critical', label: 'Critical', render: (row) => enumBadge(labOrder(row).hasCritical) },
      { key: 'orderedAt', label: 'Ordered', sortBy: 'orderedAt', render: (row) => dateCell(labOrder(row).orderedAt) },
    ],
  },
  {
    resource: 'inventory-items',
    title: 'Inventory Items',
    subtitle: 'Search inventory by item name, SKU, category, stock level, department, and expiry date.',
    permission: 'inventory:read',
    searchPlaceholder: 'Search inventory by name or SKU',
    emptyText: 'No inventory items match these filters.',
    filters: [
      { name: 'category', label: 'Category', placeholder: 'Category name' },
      { name: 'categoryId', label: 'Category ID', placeholder: 'Category UUID' },
      { name: 'stockLevel', label: 'Stock level', type: 'select', placeholder: 'All stock levels', options: options(stockLevels) },
      { name: 'departmentId', label: 'Department ID', placeholder: 'Department UUID' },
      { name: 'expiryFrom', label: 'Expiry from', type: 'date' },
      { name: 'expiryTo', label: 'Expiry to', type: 'date' },
    ],
    columns: [
      {
        key: 'name',
        label: 'Item',
        sortBy: 'name',
        render: (row) => {
          const item = inventoryItem(row);
          return detailBlock(item.name, item.sku);
        },
      },
      { key: 'stock', label: 'Stock', sortBy: 'currentStock', render: (row) => `${inventoryItem(row).currentStock} ${inventoryItem(row).unitOfMeasure}` },
      { key: 'reorder', label: 'Reorder', sortBy: 'reorderLevel', render: (row) => fallback(inventoryItem(row).reorderLevel) },
      { key: 'stockLevel', label: 'Level', render: (row) => enumBadge(inventoryItem(row).stockLevel) },
      { key: 'category', label: 'Category', sortBy: 'category', render: (row) => inventoryItem(row).category.name },
      { key: 'department', label: 'Department', render: (row) => inventoryItem(row).department?.name ?? '-' },
      { key: 'expiryDate', label: 'Expiry', sortBy: 'expiryDate', render: (row) => dateCell(inventoryItem(row).expiryDate, false) },
    ],
  },
  {
    resource: 'staff',
    title: 'Staff',
    subtitle: 'Search staff by employee code, specialization, department, position, and status.',
    permission: 'staff:read',
    searchPlaceholder: 'Search staff by name or specialization',
    emptyText: 'No staff members match these filters.',
    filters: [
      { name: 'status', label: 'Status', type: 'select', placeholder: 'All statuses', options: options(staffStatuses) },
      { name: 'departmentId', label: 'Department ID', placeholder: 'Department UUID' },
      { name: 'positionTypeId', label: 'Position ID', placeholder: 'Position type UUID' },
    ],
    columns: [
      {
        key: 'staff',
        label: 'Staff',
        sortBy: 'employeeCode',
        render: (row) => {
          const item = staff(row);
          return detailBlock(item.displayName, item.employeeCode);
        },
      },
      { key: 'position', label: 'Position', sortBy: 'positionType', render: (row) => staff(row).positionType.name },
      { key: 'specialization', label: 'Specialization', sortBy: 'specialization', render: (row) => fallback(staff(row).specialization) },
      {
        key: 'departments',
        label: 'Departments',
        render: (row) => {
          const departments = staff(row).departments;
          return departments.length ? (
            <div className="flex flex-wrap gap-1.5">
              {departments.map((department) => (
                <Badge key={department.id} variant={department.isPrimary ? 'info' : 'neutral'}>
                  {department.name}
                </Badge>
              ))}
            </div>
          ) : (
            '-'
          );
        },
      },
      { key: 'status', label: 'Status', sortBy: 'employmentStatus', render: (row) => enumBadge(staff(row).employmentStatus) },
      { key: 'hireDate', label: 'Hire date', sortBy: 'hireDate', render: (row) => dateCell(staff(row).hireDate, false) },
    ],
  },
  {
    resource: 'audit-logs',
    title: 'Audit Logs',
    subtitle: 'Search compliance logs by action, entity, user, IP address, and date range.',
    permission: 'audit_logs:read',
    searchPlaceholder: 'Search audit logs by action or entity',
    emptyText: 'No audit logs match these filters.',
    filters: [
      { name: 'userId', label: 'User ID', placeholder: 'User UUID' },
      { name: 'action', label: 'Action', placeholder: 'Action' },
      { name: 'entity', label: 'Entity', placeholder: 'Entity' },
      { name: 'from', label: 'From', type: 'date' },
      { name: 'to', label: 'To', type: 'date' },
      { name: 'ip', label: 'IP address', placeholder: 'IP address' },
    ],
    columns: [
      { key: 'timestamp', label: 'Timestamp', sortBy: 'timestamp', render: (row) => dateCell(auditLog(row).timestamp) },
      { key: 'action', label: 'Action', sortBy: 'action', render: (row) => auditLog(row).action },
      { key: 'entity', label: 'Entity', sortBy: 'entity', render: (row) => detailBlock(auditLog(row).entity, auditLog(row).entityId) },
      { key: 'userId', label: 'User', sortBy: 'userId', render: (row) => fallback(auditLog(row).userId) },
      { key: 'ip', label: 'IP', sortBy: 'ip', render: (row) => fallback(auditLog(row).ip) },
      { key: 'requestId', label: 'Request', render: (row) => fallback(auditLog(row).requestId) },
    ],
  },
];

export function getSearchResourceConfig(resource?: string) {
  return searchResourceConfigs.find((config) => config.resource === resource);
}
