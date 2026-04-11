import type { RootState } from '@/app/store';

export const selectAuth = (state: RootState) => state.auth;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.accessToken && state.auth.user);
