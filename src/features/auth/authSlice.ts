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
  refreshToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  tokens: { accessToken: string; refreshToken: string } | null;
}

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface LegacyAuthPayload {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
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
      state.refreshToken = payload.refreshToken;
      state.user = withLegacyRole(payload.user);
      state.tokens = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      };
      state.status = 'authenticated';
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = withLegacyRole(action.payload);
      state.status = state.accessToken ? 'authenticated' : state.status;
    },
    hydrateSession: (state, action: PayloadAction<Partial<AuthState>>) => {
      state.accessToken = action.payload.accessToken ?? null;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user ? withLegacyRole(action.payload.user) : null;
      state.tokens =
        state.accessToken && state.refreshToken
          ? { accessToken: state.accessToken, refreshToken: state.refreshToken }
          : null;
      state.status = state.accessToken || state.refreshToken ? 'loading' : 'unauthenticated';
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
