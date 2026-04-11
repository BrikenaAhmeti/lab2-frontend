import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '@/ui/atoms/Button';
import { useAppDispatch } from '@/app/hooks';
import { markFinishedGetStarted } from '@/domain/auth/authSlice';
const ChooseSetup = () => {
    const dispatch = useAppDispatch();
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: "Choose your initial setup" }), _jsx(Button, { onClick: () => dispatch(markFinishedGetStarted()), children: "Continue" })] }));
};
export default ChooseSetup;
