import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Button from '@/ui/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = currentUser?.name ?? currentUser?.email ?? 'MedSphere';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/70 p-1.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        {initial}
      </div>
      <div className="hidden min-w-0 text-right sm:block">
        <p className="max-w-44 truncate text-sm font-semibold leading-5 text-foreground">{displayName}</p>
        <p className="max-w-44 truncate text-[11px] leading-4 text-muted">{currentUser?.roles?.join(', ')}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="h-8 rounded-lg px-2.5 text-danger hover:bg-danger/10"
        leftIcon={<LogOut className="h-4 w-4" />}
      >
        Logout
      </Button>
    </div>
  );
}
