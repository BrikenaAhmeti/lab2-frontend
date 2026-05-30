import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import PatientRegistrationPage from '@/features/auth/pages/PatientRegistrationPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
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
    verifyEmail: vi.fn(),
  },
}));

describe('email-based auth flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('registers a patient without logging in and opens code verification', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
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
    fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'arta' } });
    fireEvent.change(screen.getByLabelText('auth.phone'), { target: { value: '+38344111222' } });
    fireEvent.change(screen.getByLabelText('auth.dateOfBirth'), { target: { value: '1995-04-10' } });
    fireEvent.change(screen.getByLabelText('auth.gender'), { target: { value: 'female' } });
    fireEvent.change(screen.getByLabelText('auth.personalNumber'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'UserPassword123!' } });
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'UserPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.createPatientAccount' }));

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
    expect(await screen.findByLabelText('auth.verificationCode')).toBeInTheDocument();
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

  it('verifies the email code and links back to login', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: true,
      message: '',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?email=arta%40example.com']}>
        <VerifyEmailPage />
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
    expect(await screen.findByText('auth.emailVerifiedCanLogin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.backToLogin' })).toBeInTheDocument();
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
