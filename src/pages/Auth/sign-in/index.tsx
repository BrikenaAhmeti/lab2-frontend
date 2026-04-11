import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/ui/organisms/auth/AuthLayout';
import AuthChatCard from '@/ui/organisms/auth/AuthChatCard';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { startSignInChat } from '@/domain/auth/authChat.slice';

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { messages } = useAppSelector((s) => s.authChat);
  const tokens = useAppSelector((s) => s.auth.tokens);

  useEffect(() => {
    dispatch(startSignInChat());
  }, [dispatch]);

  useEffect(() => {
    const authed =
      !!tokens?.accessToken ||
      messages.some((m: any) => m.agent?.stage === 'authenticated');

    if (authed) navigate('/');
  }, [messages, tokens, navigate]);

  const left = (
    <>
      <div className="flex items-center gap-3">
        <img
          src="/assets/admin/header-icon.svg"
          className="h-10 w-auto object-contain"
          alt="HotelWorld AI"
        />
      </div>

      <div className="mt-10">
        <h1 className="text-5xl font-semibold">Sign in</h1>
        <p className="text-muted mt-2">Into your hotel dashboard</p>
      </div>

      <AuthChatCard />

      <div className="mt-auto pt-10 text-xs text-muted">
        Terms • Privacy Policy
      </div>
    </>
  );

  return <AuthLayout left={left} />;
}
