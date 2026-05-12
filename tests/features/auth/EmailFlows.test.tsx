import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import { authApi } from '@/lib/api/auth-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
    resendVerification: vi.fn(),
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
});
