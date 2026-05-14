import { useNavigate } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-medium text-foreground">{currentUser?.name ?? currentUser?.email}</p>
        <p className="truncate text-xs text-muted">{currentUser?.roles?.join(', ')}</p>
      </div>
      <Button variant="danger" onClick={onLogout}>
        Logout
      </Button>
    </div>
  );
}
