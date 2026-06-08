import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import PatientRegistrationPage from '@/features/auth/pages/PatientRegistrationPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import { authApi } from '@/lib/api/auth-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
    register: vi.fn(),
    resendVerification: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

describe('email-based auth flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('shows email-based forgot password messaging and no developer token UI', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.sendResetLink' }));

    expect(await screen.findByText('auth.checkEmailReset')).toBeInTheDocument();
    expect(screen.queryByText('auth.developerToken')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'auth.copyToken' })).not.toBeInTheDocument();
  });

  it('shows the backend message when forgot password email is missing', async () => {
    vi.mocked(authApi.forgotPassword).mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 404',
      response: {
        status: 404,
        data: {
          message: 'Email is missing from our records.',
        },
      },
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'missing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.sendResetLink' }));

    expect(await screen.findByText('Email is missing from our records.')).toBeInTheDocument();
  });

  it('resets password with the emailed query token', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=raw-reset-token']}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    fireEvent.change(document.getElementById('reset-password')!, { target: { value: 'AnotherStrong123!' } });
    fireEvent.change(document.getElementById('confirm-password')!, { target: { value: 'AnotherStrong123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.resetPassword' }));

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'raw-reset-token',
        newPassword: 'AnotherStrong123!',
      });
    });
    expect(await screen.findByText('auth.resetSuccess')).toBeInTheDocument();
  });

  it('shows email-based resend verification messaging and no developer token UI', async () => {
    vi.mocked(authApi.resendVerification).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter>
        <ResendVerificationPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.resendVerification' }));

    await waitFor(() => expect(authApi.resendVerification).toHaveBeenCalledWith({ email: 'user@example.com' }));
    expect(await screen.findByText('auth.checkEmailVerification')).toBeInTheDocument();
    expect(screen.queryByText('auth.developerToken')).not.toBeInTheDocument();
  });

  it('registers a patient without logging in and asks them to use the emailed link', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<PatientRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.firstName'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('auth.lastName'), { target: { value: 'Krasniqi' } });
    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'arta@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'arta' } });
    fireEvent.change(screen.getByLabelText('auth.phone'), { target: { value: '+38344111222' } });
    fireEvent.change(screen.getByLabelText('auth.dateOfBirth'), { target: { value: '1995-04-10' } });
    fireEvent.change(screen.getByLabelText('auth.gender'), { target: { value: 'female' } });
    fireEvent.change(screen.getByLabelText('auth.personalNumber'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'UserPassword123!' } });
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'UserPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.registerAsPatient' }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        firstName: 'Arta',
        lastName: 'Krasniqi',
        email: 'arta@example.com',
        password: 'UserPassword123!',
        personalNumber: '1234567890',
        username: 'arta',
        phone: '+38344111222',
        dateOfBirth: '1995-04-10',
        gender: 'female',
      });
    });
    expect(await screen.findByText('auth.registrationCheckEmailLink')).toBeInTheDocument();
  });

  it('carries the personal number into legacy code verification so existing history can be linked', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: true,
      message: '',
    });
    window.sessionStorage.setItem(
      'medsphere.patientRegistrationIdentity',
      JSON.stringify({ email: 'arta@example.com', personalNumber: '1234567890' })
    );

    render(
      <MemoryRouter initialEntries={['/verify-email?email=arta%40example.com']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<div>login-confirmed</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.verificationCode'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.verifyCode' }));

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith({
        email: 'arta@example.com',
        code: '123456',
        personalNumber: '1234567890',
      });
    });
    expect(window.sessionStorage.getItem('medsphere.patientRegistrationIdentity')).toBeNull();
    expect(await screen.findByText('login-confirmed')).toBeInTheDocument();
  });

  it('carries the personal number into email verification so existing history can be linked', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      success: true,
      message: '',
    });
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<PatientRegistrationPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.firstName'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('auth.lastName'), { target: { value: 'Krasniqi' } });
    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'arta@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.personalNumber'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'UserPassword123!' } });
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'UserPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.createPatientAccount' }));

    fireEvent.change(await screen.findByLabelText('auth.verificationCode'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.verifyCode' }));

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith({
        email: 'arta@example.com',
        code: '123456',
        personalNumber: '1234567890',
      });
    });
    expect(window.sessionStorage.getItem('medsphere.patientRegistrationIdentity')).toBeNull();
  });

  it('keeps username, phone, date of birth, and gender optional during patient registration', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<PatientRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.firstName'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('auth.lastName'), { target: { value: 'Krasniqi' } });
    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'arta@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.personalNumber'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'UserPassword123!' } });
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'UserPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.registerAsPatient' }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Arta',
        lastName: 'Krasniqi',
        email: 'arta@example.com',
        password: 'UserPassword123!',
        personalNumber: '1234567890',
      }));
    });
  });

  it('verifies the emailed token link and redirects to login confirmation', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=raw-token']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<div>login-confirmed</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith({ token: 'raw-token' });
    });
    expect(await screen.findByText('login-confirmed')).toBeInTheDocument();
  });

  it('verifies the email code and redirects to login confirmation', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?email=arta%40example.com']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<div>login-confirmed</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.verificationCode'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.verifyCode' }));

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith({
        email: 'arta@example.com',
        code: '123456',
      });
    });
    expect(await screen.findByText('login-confirmed')).toBeInTheDocument();
  });

  it('requires exactly six digits for email verification', async () => {
    render(
      <MemoryRouter initialEntries={['/verify-email?email=arta%40example.com']}>
        <VerifyEmailPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.verificationCode'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.verifyCode' }));

    expect(await screen.findByText('auth.codeValidationError')).toBeInTheDocument();
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });

  it('shows resend verification form when code verification fails', async () => {
    vi.mocked(authApi.verifyEmail).mockRejectedValue(new Error('expired'));

    render(
      <MemoryRouter initialEntries={['/verify-email?email=arta%40example.com']}>
        <VerifyEmailPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('auth.verificationCode'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.verifyCode' }));

    expect(await screen.findByText('auth.verifyInvalidOrExpired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.resendVerification' })).toBeInTheDocument();
  });
});
