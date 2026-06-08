import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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

  it('keeps inactive patient accounts on login and points them to their emailed link', async () => {
    mocks.login.mockRejectedValue(forbiddenError('Account inactive. Please verify your email.'));

    renderLogin();
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    expect(await screen.findByText('auth.verifyEmailLinkBeforeLogin')).toBeInTheDocument();
  });

  it('starts blank and hides demo account shortcuts', () => {
    renderLogin();

    expect(screen.getByLabelText('auth.loginIdentifier')).toHaveValue('');
    expect(screen.getByLabelText('auth.password')).toHaveValue('');
    expect(screen.queryByText('auth.demoAccounts')).not.toBeInTheDocument();
    expect(screen.queryByText('auth.patientLogin')).not.toBeInTheDocument();
    expect(screen.queryByText('auth.staffLogin')).not.toBeInTheDocument();
  });

  it('links back to the public site and public booking page', () => {
    renderLogin();

    expect(screen.getByRole('link', { name: 'auth.backToWebsite' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'auth.bookAppointment' })).toHaveAttribute('href', '/book-appointment');
  });

  it('links new patients to registration', () => {
    renderLogin();

    expect(screen.getByRole('link', { name: 'auth.registerAsPatient' })).toHaveAttribute('href', '/register');
  });

  it('shows confirmation after an email verification link returns to login', () => {
    renderLogin('/login?verified=1');

    expect(screen.getByText('auth.emailVerifiedCanLogin')).toBeInTheDocument();
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
