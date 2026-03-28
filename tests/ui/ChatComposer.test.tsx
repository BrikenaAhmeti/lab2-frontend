import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import authChatReducer from '@/domain/auth/authChat.slice';
import authReducer from '@/domain/auth/authSlice';

import ChatComposer from '@/ui/organisms/auth/ChatComposer';

function renderWithStore(preloadedState?: {
    authChat?: any;
    auth?: any;
}) {
    const store = configureStore({
        reducer: {
            authChat: authChatReducer,
            auth: authReducer,
        },
        preloadedState,
    });

    render(
        <Provider store={store}>
            <ChatComposer />
        </Provider>
    );

    return store;
}


test('send button disabled when no text', () => {
    renderWithStore({
        authChat: { chatId: 'c1', messages: [{ _id: 'a', agent: { message: 'hi' } }], loading: false, error: null },
        auth: { user: null, tokens: null },
    });

    const btn = screen.getByRole('button', { name: /send/i });
    expect(btn).toBeDisabled();
});

test('input disabled when loading', () => {
    renderWithStore({
        authChat: { chatId: 'c1', messages: [{ _id: 'a', agent: { message: 'hi' } }], loading: true, error: null },
        auth: { user: null, tokens: null },
    });

    expect(screen.getByPlaceholderText(/write something/i)).toBeDisabled();
});
