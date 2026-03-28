import { useThemeMode } from '@/hooks/useThemeMode';

export default function ThemeToggle() {
  const { mode, cycle, setMode } = useThemeMode();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={cycle}
        className="px-3 py-1 rounded border bg-gray-100 dark:bg-gray-800"
        title="Cycle theme: light → dark → system"
      >
        Theme: {mode}
      </button>
      <div className="hidden sm:flex gap-1">
        <button className="px-2 py-1 rounded border" onClick={() => setMode('light')}>Light</button>
        <button className="px-2 py-1 rounded border" onClick={() => setMode('dark')}>Dark</button>
        <button className="px-2 py-1 rounded border" onClick={() => setMode('system')}>System</button>
      </div>
    </div>
  );
}
