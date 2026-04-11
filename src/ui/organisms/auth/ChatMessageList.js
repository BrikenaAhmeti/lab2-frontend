import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/hooks';
export default function ChatMessageList() {
    const { messages, error } = useAppSelector((s) => s.authChat);
    const endRef = useRef(null);
    useEffect(() => {
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, [messages.length]);
    return (_jsxs("div", { className: "h-[60vh] overflow-auto bg-surface p-4", children: [messages.map((m) => {
                if (m.agent) {
                    return (_jsxs("div", { className: "flex gap-3 mb-3", children: [_jsx("img", { alt: "agent", className: "w-9 h-9 rounded-full object-cover border border-border", src: "/assets/agents/sage-agent-icon.svg" }), _jsx("div", { className: "max-w-[85%] rounded-2xl bg-card border border-border px-4 py-3", children: _jsx("div", { className: "text-sm leading-relaxed", children: m.agent.message }) })] }, m._id));
                }
                const isPending = m.user?.type === 'pending';
                const isError = m.user?.type === 'error';
                return (_jsx("div", { className: "flex justify-end mb-3", children: _jsx("div", { className: [
                            'max-w-[85%] rounded-2xl px-4 py-3 text-sm text-primary-foreground bg-primary',
                            isPending ? 'opacity-60' : '',
                            isError ? 'border-2 border-danger opacity-70' : '',
                        ].join(' '), children: m.user.message }) }, m._id));
            }), error && _jsx("div", { className: "text-danger text-sm mt-2", children: error }), _jsx("div", { ref: endRef })] }));
}
