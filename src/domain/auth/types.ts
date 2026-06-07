export type Role =
  | 'Super Admin'
  | 'Admin'
  | 'Doctor'
  | 'Nurse'
  | 'Lab Technician'
  | 'Pharmacist'
  | 'Receptionist'
  | 'Patient';

export type Tokens = { accessToken: string; refreshToken: string };
export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  role?: string;
};
