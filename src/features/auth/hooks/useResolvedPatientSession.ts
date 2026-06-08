import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setUser, type AuthUser } from '@/features/auth/authSlice';
import { authApi } from '@/lib/api/auth-api';
import { patientsApi } from '@/lib/api/patients-api';
import { getUserRoleNames, hasRole } from '../utils/roles';
import { resolveSessionPatientId } from '../utils/patientSession';
import { authUserFromAccessToken, mergeAuthUserSources } from '../utils/tokenSession';

function sameList(left: string[] = [], right: string[] = []) {
  return left.join('|') === right.join('|');
}

function needsUserSync(current: AuthUser | null, next: AuthUser) {
  if (!current) return true;

  return (
    current.id !== next.id ||
    current.email !== next.email ||
    current.firstName !== next.firstName ||
    current.lastName !== next.lastName ||
    current.username !== next.username ||
    current.role !== next.role ||
    !sameList(current.roles, next.roles) ||
    !sameList(current.permissions, next.permissions) ||
    resolveSessionPatientId(current) !== resolveSessionPatientId(next)
  );
}

export function useResolvedPatientSession(enabled = true) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const user = auth.user;
  const tokenUser = useMemo(() => authUserFromAccessToken(auth.accessToken), [auth.accessToken]);
  const sessionUser = useMemo(() => mergeAuthUserSources(tokenUser, user), [tokenUser, user]);
  const sessionPatientId = resolveSessionPatientId(sessionUser);
  const sessionIsPatient = Boolean(sessionUser && hasRole(getUserRoleNames(sessionUser), 'Patient'));
  const shouldResolveFromAuth =
    enabled &&
    Boolean(auth.accessToken) &&
    !sessionPatientId &&
    (sessionIsPatient || !sessionUser || getUserRoleNames(sessionUser).length === 0);

  const authUserQuery = useQuery({
    queryKey: ['auth', 'patient-session-user', sessionUser?.id ?? auth.accessToken],
    queryFn: () => authApi.me(),
    enabled: shouldResolveFromAuth,
    retry: false,
    staleTime: 60_000,
  });

  const authUser = useMemo(
    () => mergeAuthUserSources(tokenUser, user, authUserQuery.data),
    [authUserQuery.data, tokenUser, user]
  );
  const authPatientId = resolveSessionPatientId(authUser);
  const authIsPatient = Boolean(authUser && hasRole(getUserRoleNames(authUser), 'Patient'));
  const authResolutionFinished = !shouldResolveFromAuth || authUserQuery.isSuccess || authUserQuery.isError;
  const shouldResolveFromCore =
    enabled && Boolean(auth.accessToken && authResolutionFinished && authIsPatient && !authPatientId);

  const profileQuery = useQuery({
    queryKey: ['auth', 'patient-session-profile', authUser?.id ?? sessionUser?.id ?? auth.accessToken],
    queryFn: () => patientsApi.me(),
    enabled: shouldResolveFromCore,
    retry: false,
    staleTime: 60_000,
  });

  const profileUserFields = useMemo(
    () =>
      profileQuery.data?.id
        ? {
            patientId: profileQuery.data.id,
            patientProfileId: profileQuery.data.id,
            profileId: profileQuery.data.id,
          }
        : null,
    [profileQuery.data?.id]
  );
  const resolvedUser = useMemo(
    () => mergeAuthUserSources(tokenUser, user, authUserQuery.data, profileUserFields),
    [authUserQuery.data, profileUserFields, tokenUser, user]
  );
  const resolvedPatientId = resolveSessionPatientId(resolvedUser) || profileQuery.data?.id || '';

  useEffect(() => {
    if (!enabled || !resolvedUser || !needsUserSync(user, resolvedUser)) {
      return;
    }

    dispatch(setUser(resolvedUser));
  }, [dispatch, enabled, resolvedUser, user]);

  const isResolving =
    enabled &&
    Boolean(auth.accessToken) &&
    !resolvedPatientId &&
    (auth.status === 'idle' ||
      auth.status === 'loading' ||
      authUserQuery.isLoading ||
      authUserQuery.isFetching ||
      profileQuery.isLoading ||
      profileQuery.isFetching);
  const isError =
    enabled &&
    !resolvedPatientId &&
    !isResolving &&
    (authUserQuery.isError || profileQuery.isError);

  return {
    patientId: resolvedPatientId,
    patient: profileQuery.data ?? null,
    user: resolvedUser,
    isResolving,
    isError,
    error: authUserQuery.error ?? profileQuery.error,
  };
}
