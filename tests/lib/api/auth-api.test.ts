import { describe, expect, it } from 'vitest';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api/axios';
import { authApi, usersApi } from '@/lib/api/auth-api';

function makeResponse<T>(cfg: InternalAxiosRequestConfig, status: number, data: T): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: cfg,
  };
}

describe('authApi', () => {
  it('sends username credentials using the backend login identifier field', async () => {
    const originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
    let requestBody: unknown;

    try {
      apiClient.defaults.adapter = async (cfg) => {
        requestBody = JSON.parse(String(cfg.data));
        return makeResponse(cfg, 200, {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: {
            id: 'user-1',
            email: 'admin@medsphere.local',
            roles: ['Super Admin'],
            permissions: [],
          },
        });
      };

      await authApi.login({ username: 'admin', password: 'Admin1234!Pass' });

      expect(requestBody).toEqual({
        email: 'admin',
        password: 'Admin1234!Pass',
      });
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('unwraps admin-created users from the backend response envelope', async () => {
    const originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
    let requestUrl = '';
    let requestBody: unknown;

    try {
      apiClient.defaults.adapter = async (cfg) => {
        requestUrl = cfg.url ?? '';
        requestBody = JSON.parse(String(cfg.data));
        return makeResponse(cfg, 201, {
          message: 'User account created successfully.',
          user: {
            id: 'doctor-1',
            firstName: 'Ana',
            lastName: 'Doctor',
            email: 'doctor@example.com',
            roles: ['Doctor'],
          },
        });
      };

      const created = await usersApi.createUser({
        firstName: 'Ana',
        lastName: 'Doctor',
        email: 'doctor@example.com',
        roles: ['Doctor'],
      });

      expect(requestUrl).toBe('/api/auth/admin/users');
      expect(requestBody).toEqual({
        firstName: 'Ana',
        lastName: 'Doctor',
        email: 'doctor@example.com',
        roles: ['Doctor'],
      });
      expect(created).toEqual({
        id: 'doctor-1',
        firstName: 'Ana',
        lastName: 'Doctor',
        email: 'doctor@example.com',
        roles: ['Doctor'],
      });
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('does not fake admin-created user success when the backend email flow fails', async () => {
    const originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;

    try {
      apiClient.defaults.adapter = async () => {
        throw new Error('SMTP delivery failed');
      };

      await expect(
        usersApi.createUser({
          firstName: 'Brea',
          lastName: 'Ahmeti',
          email: 'ahmetibrea@gmail.com',
          roles: ['Patient'],
        })
      ).rejects.toThrow('SMTP delivery failed');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});
