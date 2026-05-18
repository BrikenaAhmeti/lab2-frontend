const roleDestinations = [
  { role: 'Super Admin', aliases: ['superadmin', 'super admin', 'super_admin'], to: '/admin' },
  { role: 'Admin', aliases: ['admin'], to: '/admin' },
  { role: 'Doctor', aliases: ['doctor'], to: '/doctor' },
  { role: 'Nurse', aliases: ['nurse'], to: '/nurse' },
  { role: 'Lab Technician', aliases: ['labtechnician', 'lab technician', 'lab_technician', 'lab-tech'], to: '/lab' },
  { role: 'Pharmacist', aliases: ['pharmacist'], to: '/pharmacy' },
  { role: 'Receptionist', aliases: ['receptionist', 'reception'], to: '/receptionist' },
  { role: 'Patient', aliases: ['patient'], to: '/patient' },
] as const;

function normalizeKey(role: string) {
  return role.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function normalizeRoleName(role: string) {
  const key = normalizeKey(role);
  const destination = roleDestinations.find((item) =>
    item.aliases.some((alias) => normalizeKey(alias) === key)
  );

  return destination?.role ?? role;
}

export function hasRole(userRoles: string[], allowedRole: string) {
  const allowed = normalizeRoleName(allowedRole);
  return userRoles.some((role) => normalizeRoleName(role) === allowed);
}

export function resolvePortalPath(roles: string[] = []) {
  const normalizedRoles = roles.map(normalizeRoleName);
  return roleDestinations.find((item) => normalizedRoles.includes(item.role))?.to ?? '/admin';
}
