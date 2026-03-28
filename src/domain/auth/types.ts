export type Role = 'admins' | 'staff' | 'viewer';

export type Tokens = { accessToken: string; refreshToken: string; };
export type AuthUser = { id: string; email: string; name: string; role: Role; };
