import { normalizeRoleName } from '@/features/auth/utils/roles';
import type { AuthUser } from '@/features/auth/authSlice';
import { patientsApi, type PatientRecord } from '@/lib/api/patients-api';
import { staffApi, type StaffRecord } from '@/lib/api/staff-api';
import type { ChatContact, ChatParticipantRole } from './chatTypes';

const roleLabels: Record<ChatParticipantRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  staff: 'Staff',
  nurse: 'Nurse',
  lab_technician: 'Lab',
  pharmacist: 'Pharmacist',
  receptionist: 'Receptionist',
  admin: 'Admin',
  department_head: 'Department Head',
  super_admin: 'Super Admin',
};

const normalizedRoleMap: Record<string, ChatParticipantRole> = {
  'Super Admin': 'super_admin',
  Admin: 'admin',
  Doctor: 'doctor',
  Nurse: 'nurse',
  'Lab Technician': 'lab_technician',
  Pharmacist: 'pharmacist',
  Receptionist: 'receptionist',
  Patient: 'patient',
};

const rolePriority: Record<ChatParticipantRole, number> = {
  doctor: 1,
  nurse: 2,
  receptionist: 3,
  patient: 4,
  staff: 5,
  lab_technician: 6,
  pharmacist: 7,
  department_head: 8,
  admin: 9,
  super_admin: 10,
};

export function chatRoleLabel(role: ChatParticipantRole) {
  return roleLabels[role];
}

function compactRole(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function chatRoleFromValue(value?: string | null): ChatParticipantRole | null {
  if (!value) return null;

  const normalized = normalizeRoleName(value);
  if (normalizedRoleMap[normalized]) return normalizedRoleMap[normalized];

  const key = compactRole(value);
  if (key.includes('doctor') || key.includes('physician')) return 'doctor';
  if (key.includes('nurse')) return 'nurse';
  if (key.includes('reception')) return 'receptionist';
  if (key.includes('patient')) return 'patient';
  if (key.includes('lab')) return 'lab_technician';
  if (key.includes('pharmac')) return 'pharmacist';
  if (key.includes('departmenthead')) return 'department_head';
  if (key.includes('superadmin')) return 'super_admin';
  if (key.includes('admin')) return 'admin';
  if (key.includes('staff')) return 'staff';

  return null;
}

function userRoleNames(user?: Pick<AuthUser, 'roles' | 'role'> | null) {
  const roles = user?.roles ?? [];
  return user?.role ? [...roles, user.role] : roles;
}

export function allowedChatParticipantRoles(user?: Pick<AuthUser, 'roles' | 'role'> | null) {
  const currentRoles = userRoleNames(user).map(normalizeRoleName);
  const allowed = new Set<ChatParticipantRole>();

  if (currentRoles.some((role) => role === 'Admin' || role === 'Super Admin')) {
    return [
      'doctor',
      'nurse',
      'receptionist',
      'patient',
      'staff',
      'lab_technician',
      'pharmacist',
      'department_head',
      'admin',
      'super_admin',
    ] satisfies ChatParticipantRole[];
  }

  if (currentRoles.includes('Doctor')) {
    ['doctor', 'nurse', 'receptionist', 'patient', 'staff'].forEach((role) =>
      allowed.add(role as ChatParticipantRole)
    );
  }

  if (currentRoles.includes('Receptionist')) {
    ['patient', 'doctor', 'nurse', 'staff'].forEach((role) => allowed.add(role as ChatParticipantRole));
  }

  if (currentRoles.includes('Nurse')) {
    ['doctor', 'receptionist', 'staff'].forEach((role) => allowed.add(role as ChatParticipantRole));
  }

  if (currentRoles.includes('Patient')) {
    ['doctor', 'receptionist'].forEach((role) => allowed.add(role as ChatParticipantRole));
  }

  if (currentRoles.includes('Lab Technician') || currentRoles.includes('Pharmacist')) {
    ['doctor', 'nurse', 'receptionist', 'staff'].forEach((role) =>
      allowed.add(role as ChatParticipantRole)
    );
  }

  return [...allowed];
}

function displayName(parts: Array<string | null | undefined>, fallback: string) {
  return parts.filter(Boolean).join(' ').trim() || fallback;
}

function firstMappedRole(values: Array<string | null | undefined>) {
  for (const value of values) {
    const role = chatRoleFromValue(value);
    if (role) return role;
  }

  return null;
}

function contactFromStaff(staff: StaffRecord): ChatContact | null {
  const id = staff.userId ?? staff.user?.id;
  if (!id) return null;

  const role =
    firstMappedRole([
      staff.positionType?.defaultRoleKey,
      staff.positionType?.name,
      staff.specialization,
    ]) ?? 'staff';
  const email = staff.user?.email ?? staff.email ?? null;

  return {
    id,
    name:
      staff.user?.name ??
      displayName(
        [staff.user?.firstName, staff.user?.lastName, staff.firstName, staff.lastName],
        email ?? staff.employeeCode ?? 'Staff member'
      ),
    email,
    role,
    roleLabel: chatRoleLabel(role),
    subtitle: staff.positionType?.name ?? staff.specialization ?? email ?? undefined,
    source: 'staff',
  };
}

function contactFromPatient(patient: PatientRecord): ChatContact | null {
  if (!patient.userId) return null;

  return {
    id: patient.userId,
    name: displayName([patient.firstName, patient.lastName], patient.email ?? 'Patient'),
    email: patient.email,
    role: 'patient',
    roleLabel: chatRoleLabel('patient'),
    subtitle: patient.email ?? patient.phone ?? undefined,
    source: 'patient',
  };
}

function matchesSearch(contact: ChatContact, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [contact.name, contact.email, contact.roleLabel, contact.subtitle]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

function scoreContact(contact: ChatContact) {
  const sourceScore = contact.source === 'chat' ? 6 : contact.source === 'user' ? 5 : 4;
  return sourceScore + (contact.role === 'staff' ? 0 : 2) + (contact.email ? 1 : 0);
}

function dedupeContacts(contacts: ChatContact[]) {
  const byId = new Map<string, ChatContact>();

  for (const contact of contacts) {
    const existing = byId.get(contact.id);
    if (!existing || scoreContact(contact) > scoreContact(existing)) {
      byId.set(contact.id, {
        ...existing,
        ...contact,
        email: contact.email ?? existing?.email,
        subtitle: contact.subtitle ?? existing?.subtitle,
      });
    }
  }

  return [...byId.values()].sort((left, right) => {
    const roleOrder = rolePriority[left.role] - rolePriority[right.role];
    if (roleOrder !== 0) return roleOrder;
    return left.name.localeCompare(right.name);
  });
}

async function settledContacts(tasks: Array<Promise<ChatContact[]>>) {
  const settled = await Promise.allSettled(tasks);
  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

export async function loadChatContacts({
  search = '',
  currentUser,
}: {
  search?: string;
  currentUser?: Pick<AuthUser, 'id' | 'roles' | 'role'> | null;
}) {
  const allowedRoles = allowedChatParticipantRoles(currentUser);
  if (allowedRoles.length === 0) return [];

  const allowed = new Set(allowedRoles);
  const needsStaff = allowedRoles.some((role) => role !== 'patient');
  const needsPatients = allowed.has('patient');
  const currentIsPatient = userRoleNames(currentUser).some((role) => normalizeRoleName(role) === 'Patient');
  const staffList = currentIsPatient ? staffApi.publicList : staffApi.list;

  const tasks: Array<Promise<ChatContact[]>> = [];

  if (needsStaff) {
    tasks.push(
      staffList({ page: 1, limit: 100, search, status: 'active' }).then((response) =>
        response.items.map(contactFromStaff).filter((contact): contact is ChatContact => Boolean(contact))
      )
    );
  }

  if (needsPatients) {
    tasks.push(
      patientsApi.list({ page: 1, limit: 100, search, isActive: true }).then((response) =>
        response.items.map(contactFromPatient).filter((contact): contact is ChatContact => Boolean(contact))
      )
    );
  }

  const contacts = await settledContacts(tasks);

  return dedupeContacts(
    contacts.filter(
      (contact) =>
        contact.id !== currentUser?.id &&
        allowed.has(contact.role) &&
        matchesSearch(contact, search)
    )
  );
}
