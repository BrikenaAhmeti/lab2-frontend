import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { patientsApi } from '@/lib/api/patients-api';
import { getUserRoleNames, hasRole } from '../utils/roles';
import { resolveSessionPatientId } from '../utils/patientSession';

export function useResolvedPatientSession(enabled = true) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const sessionPatientId = resolveSessionPatientId(user);
  const isPatient = Boolean(user && hasRole(getUserRoleNames(user), 'Patient'));
  const shouldResolveFromCore = enabled && Boolean(user?.id && isPatient && !sessionPatientId);

  const profileQuery = useQuery({
    queryKey: ['auth', 'patient-session-profile', user?.id],
    queryFn: () => patientsApi.me(),
    enabled: shouldResolveFromCore,
    retry: false,
  });

  const resolvedPatientId = sessionPatientId || profileQuery.data?.id || '';

  useEffect(() => {
    if (!user || sessionPatientId || !profileQuery.data?.id) {
      return;
    }

    dispatch(
      setUser({
        ...user,
        patientId: profileQuery.data.id,
        patientProfileId: profileQuery.data.id,
        profileId: profileQuery.data.id,
      })
    );
  }, [dispatch, profileQuery.data?.id, sessionPatientId, user]);

  return {
    patientId: resolvedPatientId,
    patient: profileQuery.data ?? null,
    isResolving: shouldResolveFromCore && profileQuery.isLoading,
    isError: shouldResolveFromCore && profileQuery.isError,
    error: profileQuery.error,
  };
}
