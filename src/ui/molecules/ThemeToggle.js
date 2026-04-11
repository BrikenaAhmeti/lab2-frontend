import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useThemeMode } from '@/hooks/useThemeMode';
import Button from '@/ui/atoms/Button';
export default function ThemeToggle() {
    const { mode, setMode } = useThemeMode();
    return (_jsxs("div", { className: "flex items-center gap-1 rounded-xl border border-border bg-card p-1", children: [_jsx(Button, { type: "button", size: "sm", variant: mode === 'light' ? 'primary' : 'ghost', onClick: () => setMode('light'), className: "h-8 px-3", children: "Light" }), _jsx(Button, { type: "button", size: "sm", variant: mode === 'dark' ? 'primary' : 'ghost', onClick: () => setMode('dark'), className: "h-8 px-3", children: "Dark" }), _jsx(Button, { type: "button", size: "sm", variant: mode === 'system' ? 'primary' : 'ghost', onClick: () => setMode('system'), className: "hidden h-8 px-3 sm:inline-flex", children: "System" })] }));
}
