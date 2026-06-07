import { useThemeMode } from '@/hooks/useThemeMode';
import Button from '@/ui/atoms/Button';

export default function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <Button
        type="button"
        size="sm"
        variant={mode === 'light' ? 'primary' : 'ghost'}
        onClick={() => setMode('light')}
        className="h-8 px-3"
      >
        Light
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === 'dark' ? 'primary' : 'ghost'}
        onClick={() => setMode('dark')}
        className="h-8 px-3"
      >
        Dark
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === 'system' ? 'primary' : 'ghost'}
        onClick={() => setMode('system')}
        className="hidden h-8 px-3 sm:inline-flex"
      >
        System
      </Button>
    </div>
  );
}
