export type ThemeMode = 'light' | 'dark' | 'system';
export const THEME_KEY = 'theme';

export function getInitialTheme(): ThemeMode {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) ?? 'system';
}
export function applyTheme(mode: ThemeMode) {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
}
