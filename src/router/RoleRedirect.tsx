import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

const roleDestinations = [
  { role: 'Super Admin', to: '/admin' },
  { role: 'Admin', to: '/admin' },
  { role: 'Doctor', to: '/doctor' },
  { role: 'Nurse', to: '/nurse' },
  { role: 'Lab Technician', to: '/lab' },
  { role: 'Pharmacist', to: '/pharmacy' },
  { role: 'Receptionist', to: '/receptionist' },
  { role: 'Patient', to: '/patient' },
] as const;

export function resolvePortalPath(roles: string[]) {
  return roleDestinations.find((item) => roles.includes(item.role))?.to ?? '/admin';
}

export default function RoleRedirect() {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  return <Navigate to={resolvePortalPath(roles)} replace />;
}
