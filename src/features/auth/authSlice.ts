import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
}

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  tokens: { accessToken: string } | null;
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
  user: null,
  status: 'idle',
  tokens: null,
};

function withLegacyRole(user: AuthUser): AuthUser {
  return {
    ...user,
    role: user.roles?.[0] ?? user.role,
  };
}

function normalizePayload(payload: AuthPayload | LegacyAuthPayload): AuthPayload {
  if ('tokens' in payload) {
    return {
      accessToken: payload.tokens.accessToken,
      refreshToken: payload.tokens.refreshToken,
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
      state.accessToken = payload.accessToken;
      state.user = withLegacyRole(payload.user);
      state.tokens = {
        accessToken: payload.accessToken,
      };
      state.status = 'authenticated';
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = withLegacyRole(action.payload);
      state.status = state.accessToken ? 'authenticated' : state.status;
    },
    hydrateSession: (state, action: PayloadAction<Partial<AuthState>>) => {
      state.accessToken = action.payload.accessToken ?? null;
      state.user = action.payload.user ? withLegacyRole(action.payload.user) : null;
      state.tokens = state.accessToken ? { accessToken: state.accessToken } : null;
      state.status = state.accessToken ? 'loading' : 'unauthenticated';
    },
    clearSession: (state) => {
      state.accessToken = null;
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
