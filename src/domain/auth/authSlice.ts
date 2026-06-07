import authReducer, {
  clearSession,
  hydrateSession,
  setAuthLoading,
  setSession,
  setUnauthenticated,
  setUser,
} from '@/features/auth/authSlice';

export { clearSession, hydrateSession, setAuthLoading, setSession, setUnauthenticated, setUser };
export const markFinishedGetStarted = () => ({ type: 'auth/markFinishedGetStarted' as const });
export default authReducer;
