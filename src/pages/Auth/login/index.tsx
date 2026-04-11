import { useState } from 'react';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import Card from '@/ui/atoms/Card';
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
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <Card title="Login" subtitle="Sign in to MedSphere">
          <div className="space-y-4">
            <Input
              id="email"
              label="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
export default Login;
