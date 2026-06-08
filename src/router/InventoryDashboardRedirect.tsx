import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { hasAnyRole } from '@/features/auth/utils/permission';
import { getUserRoleNames } from '@/features/auth/utils/roles';

export default function InventoryDashboardRedirect() {
  const user = useAppSelector((state) => state.auth.user);
  const roles = getUserRoleNames(user);
  const isPharmacist = hasAnyRole(roles, ['Pharmacist']);
  const isAdmin = hasAnyRole(roles, ['Admin', 'Super Admin']);

  return <Navigate to={isPharmacist && !isAdmin ? '/pharmacy/inventory' : '/admin/inventory'} replace />;
}
