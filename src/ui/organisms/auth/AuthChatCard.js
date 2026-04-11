import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ChatMessageList from './ChatMessageList';
import ChatComposer from './ChatComposer';
export default function AuthChatCard() {
    return (_jsx("div", { className: "mt-8 w-full max-w-xl", children: _jsxs("div", { className: "rounded-2xl overflow-hidden border border-border bg-card shadow-soft", children: [_jsxs("div", { className: "flex items-center gap-3 bg-primary text-primary-foreground px-5 py-4", children: [_jsx("img", { alt: "agent", className: "w-10 h-10 rounded-full object-cover", src: "/assets/agents/sage-agent-icon.svg" }), _jsxs("div", { className: "font-semibold text-lg", children: ["Leo ", _jsx("span", { className: "font-normal opacity-90", children: "\u2014 AI Search Engine" })] })] }), _jsx(ChatMessageList, {}), _jsx("div", { className: "p-4 border-t border-border", children: _jsx(ChatComposer, {}) })] }) }));
}
