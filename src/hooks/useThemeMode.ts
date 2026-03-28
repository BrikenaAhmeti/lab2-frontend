import { useEffect, useState } from 'react';
import type { ThemeMode } from '@/config/theme';
import { THEME_KEY, getInitialTheme, applyTheme } from '@/config/theme';

export function useThemeMode() {
    const [mode, setMode] = useState<ThemeMode>(getInitialTheme());

    useEffect(() => {
        applyTheme(mode);
        localStorage.setItem(THEME_KEY, mode);
    }, [mode]);

    useEffect(() => {
        if (mode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyTheme('system');
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, [mode]);

    const cycle = () =>
        setMode((m) => (m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light'));

    return { mode, setMode, cycle };
}
