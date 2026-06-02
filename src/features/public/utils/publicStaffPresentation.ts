import type { StaffDepartment, StaffRecord } from '@/lib/api/staff-api';

const employeeCodePattern = /^[A-Z]{2,5}-\d+$/;

export function getPublicDepartmentName(department: StaffDepartment) {
  return department.name ?? department.department?.name ?? 'Department';
}

export function isDoctorProfile(staff: StaffRecord) {
  const roleKey = staff.positionType?.defaultRoleKey?.toLowerCase() ?? '';
  const roleName = staff.positionType?.name?.toLowerCase() ?? '';
  const code = staff.employeeCode?.toUpperCase() ?? '';

  return roleKey.includes('doctor') || roleName.includes('doctor') || roleName.includes('physician') || code.startsWith('DR-');
}

function extractNameFromBio(staff: StaffRecord) {
  const bio = staff.bio?.trim();
  if (!bio) return null;

  const doctorMatch = bio.match(/\bDr\.\s+([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,2})/);
  if (doctorMatch?.[1]) return `Dr. ${doctorMatch[1]}`;

  const staffMatch = bio.match(/^([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,2})\s+(handles|manages|coordinates|provides|focuses|processes)\b/);
  return staffMatch?.[1] ?? null;
}

export function getPublicStaffDisplayName(staff: StaffRecord) {
  const userName = staff.user?.name ?? [staff.user?.firstName, staff.user?.lastName].filter(Boolean).join(' ');
  const profileName = [staff.firstName, staff.lastName].filter(Boolean).join(' ');
  const directName = userName || profileName;

  if (directName) {
    return isDoctorProfile(staff) && !directName.startsWith('Dr.') ? `Dr. ${directName}` : directName;
  }

  const bioName = extractNameFromBio(staff);
  if (bioName) return bioName;

  return staff.employeeCode || staff.email || 'Care team member';
}

export function getPublicStaffTitle(staff: StaffRecord) {
  if (staff.specialization) return staff.specialization;
  return staff.positionType?.name ?? 'Care team';
}

export function getPublicStaffSubtitle(staff: StaffRecord) {
  const position = staff.positionType?.name;
  const primaryDepartment = staff.departments?.find((department) => department.isPrimary) ?? staff.departments?.[0];
  const departmentName = primaryDepartment ? getPublicDepartmentName(primaryDepartment) : null;

  return [position, departmentName].filter(Boolean).join(' · ') || 'MedSphere care team';
}

export function getPublicStaffInitials(staff: StaffRecord) {
  const name = getPublicStaffDisplayName(staff).replace(/^Dr\.\s+/, '');
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (initials && !employeeCodePattern.test(name)) return initials;
  return staff.employeeCode?.slice(0, 2).toUpperCase() ?? 'MS';
}

export function getPublicStaffTags(staff: StaffRecord) {
  const departmentTags = staff.departments?.map(getPublicDepartmentName) ?? [];
  const tags = [staff.specialization, ...departmentTags, staff.positionType?.name].filter(Boolean) as string[];

  return Array.from(new Set(tags)).slice(0, 4);
}
