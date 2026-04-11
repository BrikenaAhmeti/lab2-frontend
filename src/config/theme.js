export const THEME_KEY = 'theme';
export function getInitialTheme() {
    return localStorage.getItem(THEME_KEY) ?? 'system';
}
export function applyTheme(mode) {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
}
