import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { normalizeRoleName } from '@/features/auth/utils/roles';

export type Role =
  | 'Super Admin'
  | 'Admin'
  | 'Doctor'
  | 'Nurse'
  | 'Lab Technician'
  | 'Pharmacist'
  | 'Receptionist'
  | 'Patient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
  role?: string;
  patientId?: string;
  patientProfileId?: string;
  profileId?: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken?: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  tokens: { accessToken: string; refreshToken?: string } | null;
}

interface AuthPayload {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

interface LegacyAuthPayload {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken?: string };
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  status: 'idle',
  tokens: null,
};

function withLegacyRole(user: AuthUser): AuthUser {
  const roles = (user.roles ?? []).map(normalizeRoleName);
  const legacyRole = user.role ? normalizeRoleName(user.role) : undefined;
  const normalizedRoles = roles.length > 0 ? roles : legacyRole ? [legacyRole] : [];

  return {
    ...user,
    roles: normalizedRoles,
    role: normalizedRoles[0] ?? legacyRole,
  };
}

function normalizePayload(payload: AuthPayload | LegacyAuthPayload): AuthPayload {
  if ('tokens' in payload) {
    return {
      accessToken: payload.tokens.accessToken,
      refreshToken: payload.tokens.refreshToken ?? (payload as unknown as AuthPayload).refreshToken,
      user: payload.user,
    };
  }
  return payload;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state) => {
      state.status = 'loading';
    },
    setSession: (state, action: PayloadAction<AuthPayload | LegacyAuthPayload>) => {
      const payload = normalizePayload(action.payload);
      const refreshToken = payload.refreshToken ?? state.refreshToken ?? undefined;
      state.accessToken = payload.accessToken;
      state.refreshToken = refreshToken ?? null;
      state.user = withLegacyRole(payload.user);
      state.tokens = {
        accessToken: payload.accessToken,
        ...(refreshToken ? { refreshToken } : {}),
      };
      state.status = 'authenticated';
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = withLegacyRole(action.payload);
      state.status = state.accessToken ? 'authenticated' : state.status;
    },
    hydrateSession: (state, action: PayloadAction<Partial<AuthState>>) => {
      const accessToken = action.payload.accessToken ?? action.payload.tokens?.accessToken ?? null;
      const refreshToken = action.payload.refreshToken ?? action.payload.tokens?.refreshToken ?? null;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = action.payload.user ? withLegacyRole(action.payload.user) : null;
      state.tokens = state.accessToken
        ? {
            accessToken: state.accessToken,
            ...(state.refreshToken ? { refreshToken: state.refreshToken } : {}),
          }
        : null;
      state.status = state.accessToken ? 'loading' : 'unauthenticated';
    },
    clearSession: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.tokens = null;
      state.status = 'unauthenticated';
    },
    setUnauthenticated: (state) => {
      state.status = 'unauthenticated';
    },
  },
});

export const {
  setAuthLoading,
  setSession,
  setUser,
  hydrateSession,
  clearSession,
  setUnauthenticated,
} = authSlice.actions;

export default authSlice.reducer;
