import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'auth.passwordTooShort')
  .max(100, 'auth.passwordTooLong')
  .regex(/[A-Z]/, 'auth.passwordNeedsUppercase')
  .regex(/[a-z]/, 'auth.passwordNeedsLowercase')
  .regex(/[0-9]/, 'auth.passwordNeedsNumber')
  .regex(/[^A-Za-z0-9]/, 'auth.passwordNeedsSpecial');

export const passwordRequirementKeys = [
  'auth.passwordLengthRule',
  'auth.passwordNeedsUppercase',
  'auth.passwordNeedsLowercase',
  'auth.passwordNeedsNumber',
  'auth.passwordNeedsSpecial',
] as const;
