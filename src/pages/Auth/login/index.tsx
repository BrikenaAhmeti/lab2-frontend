import { useState } from 'react';
import Button from '@/ui/atoms/Button';
import { useAppDispatch } from '@/app/hooks';
import { setSession } from '@/domain/auth/authSlice';
import { api } from '@/libs/axios/client';

const Login = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.core.post('/auth/login', { email, password });
      dispatch(setSession(data)); // expects { user, tokens }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Login</h1>
        <input className="w-full mb-3 rounded border px-3 py-2 bg-transparent" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full mb-4 rounded border px-3 py-2 bg-transparent" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" loading={loading}>Sign in</Button>
      </form>
    </div>
  );
}
export default Login;