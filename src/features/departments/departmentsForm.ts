import {
  normalizeWorkingHours,
  visibleWorkingHours,
  workingHoursRowsToValue,
  type WorkingHoursRow,
} from '@/features/settings/workingHours';
import type { DepartmentPayload, DepartmentRecord } from '@/lib/api/departments-api';

export interface DepartmentForm {
  name: string;
  description: string;
  floor: string;
  phoneExtension: string;
  operatingHoursRows: WorkingHoursRow[];
  sortOrder: number;
  isActive: boolean;
}

export const emptyDepartmentForm: DepartmentForm = {
  name: '',
  description: '',
  floor: '',
  phoneExtension: '',
  operatingHoursRows: normalizeWorkingHours(null),
  sortOrder: 0,
  isActive: true,
};

export function toDepartmentForm(department: DepartmentRecord): DepartmentForm {
  return {
    name: department.name,
    description: department.description ?? '',
    floor: department.floor ?? '',
    phoneExtension: department.phoneExtension ?? '',
    operatingHoursRows: normalizeWorkingHours(department.operatingHours),
    sortOrder: department.sortOrder,
    isActive: department.isActive,
  };
}

export function validateDepartmentForm(form: DepartmentForm) {
  if (!form.name.trim()) {
    return 'Department name is required.';
  }

  if (!Number.isFinite(form.sortOrder) || form.sortOrder < 0) {
    return 'Sort order cannot be negative.';
  }

  const invalidRow = form.operatingHoursRows.find(
    (row) => row.isOpen && (!row.startTime || !row.endTime || row.startTime >= row.endTime)
  );

  if (invalidRow) {
    return `${invalidRow.label} needs a valid start and end time.`;
  }

  return '';
}

export function toDepartmentPayload(form: DepartmentForm): DepartmentPayload {
  const openRows = visibleWorkingHours(form.operatingHoursRows);

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    floor: form.floor.trim() || null,
    phoneExtension: form.phoneExtension.trim() || null,
    operatingHours: openRows.length > 0 ? workingHoursRowsToValue(form.operatingHoursRows) : null,
    sortOrder: form.sortOrder,
    isActive: form.isActive,
  };
}
