import { jsx as _jsx } from "react/jsx-runtime";
// tests/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/ui/atoms/Button';
describe('Button', () => {
    it('renders text', () => {
        render(_jsx(Button, { children: "Click" }));
        expect(screen.getByText('Click')).toBeInTheDocument();
    });
    it('handles click', () => {
        const onClick = vi.fn();
        render(_jsx(Button, { onClick: onClick, children: "Go" }));
        fireEvent.click(screen.getByText('Go'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
    it('is disabled when loading', () => {
        render(_jsx(Button, { loading: true, children: "Load" }));
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
