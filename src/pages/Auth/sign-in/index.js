import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/ui/organisms/auth/AuthLayout';
import AuthChatCard from '@/ui/organisms/auth/AuthChatCard';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { startSignInChat } from '@/domain/auth/authChat.slice';
export default function SignInPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { messages } = useAppSelector((s) => s.authChat);
    const tokens = useAppSelector((s) => s.auth.tokens);
    useEffect(() => {
        dispatch(startSignInChat());
    }, [dispatch]);
    useEffect(() => {
        const authed = !!tokens?.accessToken ||
            messages.some((m) => m.agent?.stage === 'authenticated');
        if (authed)
            navigate('/');
    }, [messages, tokens, navigate]);
    const left = (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx("img", { src: "/assets/admin/header-icon.svg", className: "h-10 w-auto object-contain", alt: "HotelWorld AI" }) }), _jsxs("div", { className: "mt-10", children: [_jsx("h1", { className: "text-5xl font-semibold", children: "Sign in" }), _jsx("p", { className: "text-muted mt-2", children: "Into your hotel dashboard" })] }), _jsx(AuthChatCard, {}), _jsx("div", { className: "mt-auto pt-10 text-xs text-muted", children: "Terms \u2022 Privacy Policy" })] }));
    return _jsx(AuthLayout, { left: left });
}
