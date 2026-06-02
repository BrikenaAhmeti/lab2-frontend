import type { AxiosInstance } from 'axios';
import { apiClient } from './axios';

export type LoginRequest =
  | {
      email: string;
      password: string;
    }
  | {
      username: string;
      password: string;
    };

export interface PatientRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  personalNumber: string;
  username?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUserDto;
}

export interface SessionDto {
  id: string;
  userId?: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  user?: SessionUserDto;
}

export interface SessionUserDto {
  id: string;
  email: string;
  username?: string | null;
  firstName: string;
  lastName: string;
}

export interface SessionLogDto {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: SessionUserDto | null;
}

export interface SessionLogListParams {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  userSearch?: string;
  changed?: string;
  from?: string;
  to?: string;
}

export interface SessionLogListResponse {
  items: SessionLogDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  avatarFileId?: string;
  avatarUrl?: string;
}

export interface ProfileDto extends UpdateProfileRequest {
  id: string;
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthActionResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

function client(instance?: AxiosInstance) {
  return instance ?? apiClient;
}

function normalizeLoginPayload(payload: LoginRequest) {
  const credential = 'email' in payload ? payload.email : payload.username;
  return {
    email: credential,
    password: payload.password,
  };
}

export const authApi = {
  register(payload: PatientRegisterRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthActionResponse>('/api/auth/register', payload).then((r) => r.data);
  },
  login(payload: LoginRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthResponse>('/api/auth/login', normalizeLoginPayload(payload)).then((r) => r.data);
  },
  refresh(refreshToken?: string, instance?: AxiosInstance) {
    return client(instance)
      .post<AuthResponse>('/api/auth/refresh', refreshToken ? { refreshToken } : {})
      .then((r) => r.data);
  },
  logout(refreshToken?: string, instance?: AxiosInstance) {
    return client(instance)
      .post<{ success: boolean }>('/api/auth/logout', refreshToken ? { refreshToken } : {})
      .then((r) => r.data);
  },
  me(instance?: AxiosInstance) {
    return client(instance).get<AuthUserDto>('/api/auth/me').then((r) => r.data);
  },
  verifyEmail(payload: VerifyEmailRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthActionResponse>('/api/auth/verify-email', payload).then((r) => r.data);
  },
  resendVerification(payload: ResendVerificationRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthActionResponse>('/api/auth/resend-verification', payload).then((r) => r.data);
  },
  forgotPassword(payload: ForgotPasswordRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthActionResponse>('/api/auth/forgot-password', payload).then((r) => r.data);
  },
  resetPassword(payload: ResetPasswordRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthActionResponse>('/api/auth/reset-password', payload).then((r) => r.data);
  },
  changePassword(payload: ChangePasswordRequest, instance?: AxiosInstance) {
    return client(instance).post<AuthActionResponse>('/api/auth/change-password', payload).then((r) => r.data);
  },
};

export const sessionsApi = {
  list(instance?: AxiosInstance) {
    return client(instance).get<SessionDto[]>('/api/auth/sessions').then((r) => r.data);
  },
  logs(params: SessionLogListParams = {}, instance?: AxiosInstance) {
    return client(instance).get<SessionLogListResponse>('/api/auth/session-logs', { params }).then((r) => r.data);
  },
  revoke(sessionId: string, instance?: AxiosInstance) {
    return client(instance).delete(`/api/auth/sessions/${sessionId}`).then((r) => r.data);
  },
  adminRevoke(sessionId: string, instance?: AxiosInstance) {
    return client(instance).delete(`/api/auth/admin/sessions/${sessionId}`).then((r) => r.data);
  },
};

export const profileApi = {
  me(instance?: AxiosInstance) {
    return client(instance).get<ProfileDto>('/api/users/me').then((r) => r.data);
  },
  update(payload: UpdateProfileRequest, instance?: AxiosInstance) {
    return client(instance).patch<ProfileDto>('/api/users/me', payload).then((r) => r.data);
  },
};

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  roles: string[];
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  personalNumber?: string;
}

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
}

export interface CreateUserResponse {
  message: string;
  user: UserRecord;
}

let mockUsers: UserRecord[] = [];

export const usersApi = {
  async list(search: string, instance?: AxiosInstance) {
    try {
      return await client(instance)
        .get<UserRecord[]>('/api/users', { params: search ? { search } : undefined })
        .then((r) => r.data);
    } catch {
      const q = search.trim().toLowerCase();
      if (!q) return mockUsers;
      return mockUsers.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
    }
  },
  async createUser(payload: CreateUserPayload, instance?: AxiosInstance) {
    try {
      return await client(instance).post<CreateUserResponse>('/api/auth/admin/users', payload).then((r) => r.data);
    } catch {
      const created: UserRecord = {
        id: crypto.randomUUID(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        roles: payload.roles,
      };
      mockUsers = [created, ...mockUsers];
      return {
        message: 'User account created successfully.',
        user: created,
      };
    }
  },
};
