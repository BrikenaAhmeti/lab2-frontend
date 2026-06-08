import { describe, expect, it } from 'vitest';
import { allowedChatParticipantRoles, chatRoleFromValue } from '@/features/chat/chatContacts';

describe('chat contact rules', () => {
  it('allows doctors to start chats with doctors, nurses, receptionists, and patients', () => {
    expect(allowedChatParticipantRoles({ roles: ['Doctor'] })).toEqual([
      'doctor',
      'nurse',
      'receptionist',
      'patient',
      'staff',
    ]);
  });

  it('allows receptionists to start chats with patients, doctors, and nurses', () => {
    expect(allowedChatParticipantRoles({ roles: ['Receptionist'] })).toEqual([
      'patient',
      'doctor',
      'nurse',
      'staff',
    ]);
  });

  it('allows nurses to start chats with doctors and receptionists', () => {
    expect(allowedChatParticipantRoles({ roles: ['Nurse'] })).toEqual([
      'doctor',
      'receptionist',
      'staff',
    ]);
  });

  it('allows lab technicians to start chats with clinic staff, not patients', () => {
    expect(allowedChatParticipantRoles({ roles: ['Lab Technician'] })).toEqual([
      'doctor',
      'nurse',
      'receptionist',
      'staff',
      'lab_technician',
      'pharmacist',
      'department_head',
    ]);
  });

  it('maps backend role keys to chat participant roles', () => {
    expect(chatRoleFromValue('doctor')).toBe('doctor');
    expect(chatRoleFromValue('reception')).toBe('receptionist');
    expect(chatRoleFromValue('lab_technician')).toBe('lab_technician');
  });
});
