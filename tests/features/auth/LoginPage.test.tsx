import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/features/auth/pages/LoginPage';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mocks.login,
  }),
}));

function forbiddenError(message: string) {
  return new AxiosError(
    message,
    '403',
    { headers: new AxiosHeaders() },
    {},
    {
      data: { message },
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
  );
}

function VerificationRouteProbe() {
  const location = useLocation();
  return <div data-testid="verification-location">{`${location.pathname}${location.search}`}</div>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerificationRouteProbe />} />
        <Route path="/admin" element={<div>admin-portal</div>} />
        <Route path="/doctor" element={<div>doctor-portal</div>} />
        <Route path="/nurse" element={<div>nurse-portal</div>} />
        <Route path="/lab" element={<div>lab-portal</div>} />
        <Route path="/pharmacy" element={<div>pharmacy-portal</div>} />
        <Route path="/receptionist" element={<div>receptionist-portal</div>} />
        <Route path="/patient" element={<div>patient-portal</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillLogin(identifier = 'admin@example.com', password = 'UserPassword123!') {
  fireEvent.change(screen.getByLabelText('auth.loginIdentifier'), {
    target: { value: identifier },
  });
  fireEvent.change(screen.getByLabelText('auth.password'), {
    target: { value: password },
  });
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['Super Admin', 'admin-portal'],
    ['Admin', 'admin-portal'],
    ['Doctor', 'doctor-portal'],
    ['Nurse', 'nurse-portal'],
    ['Lab Technician', 'lab-portal'],
    ['Pharmacist', 'pharmacy-portal'],
    ['Receptionist', 'receptionist-portal'],
    ['Patient', 'patient-portal'],
  ])('redirects %s users to their portal', async (role, portalText) => {
    mocks.login.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      roles: [role],
      permissions: [],
    });

    renderLogin();
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'UserPassword123!',
    }));
    expect(await screen.findByText(portalText)).toBeInTheDocument();
  });

  it('sends inactive patient accounts to the verification-code screen', async () => {
    mocks.login.mockRejectedValue(forbiddenError('Account inactive. Please verify your email.'));

    renderLogin();
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    expect(await screen.findByTestId('verification-location')).toHaveTextContent(
      '/verify-email?email=admin%40example.com'
    );
  });

  it('starts blank and hides demo account shortcuts', () => {
    renderLogin();

    expect(screen.getByLabelText('auth.loginIdentifier')).toHaveValue('');
    expect(screen.getByLabelText('auth.password')).toHaveValue('');
    expect(screen.queryByText('auth.demoAccounts')).not.toBeInTheDocument();
  });

  it('submits a username when the credential is not an email address', async () => {
    mocks.login.mockResolvedValue({
      id: 'user-1',
      email: 'doctor@example.com',
      roles: ['Doctor'],
      permissions: [],
    });

    renderLogin();
    fillLogin('doctor01');
    fireEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith({
      username: 'doctor01',
      password: 'UserPassword123!',
    }));
    expect(await screen.findByText('doctor-portal')).toBeInTheDocument();
  });

  it('falls back to the legacy role field for portal redirects', async () => {
    mocks.login.mockResolvedValue({
      id: 'user-1',
      email: 'patient@example.com',
      roles: [],
      role: 'Patient',
      permissions: [],
    });

    renderLogin();
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    expect(await screen.findByText('patient-portal')).toBeInTheDocument();
  });
});
