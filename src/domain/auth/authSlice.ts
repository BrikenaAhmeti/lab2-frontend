import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser, Tokens } from './types';

type AuthState = {
  user: AuthUser | null;
  tokens: Tokens | null;
  finishedGetStarted?: boolean;
};

const initialState: AuthState = { user: null, tokens: null, finishedGetStarted: false };

const slice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setSession: (s, a: PayloadAction<{ user: AuthUser; tokens: Tokens }>) => {
      s.user = a.payload.user; s.tokens = a.payload.tokens;
      localStorage.setItem('role', a.payload.user.role);
    },
    clearSession: (s) => { s.user = null; s.tokens = null; s.finishedGetStarted = false; localStorage.removeItem('role'); },
    markFinishedGetStarted: (s) => { s.finishedGetStarted = true; }
  }
});
export const { setSession, clearSession, markFinishedGetStarted } = slice.actions;
export default slice.reducer;
