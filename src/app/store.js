import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/domain/auth/authSlice';
import transactionsReducer from '@/domain/transactions/transactions.slice';
import authChatReducer from '@/domain/auth/authChat.slice';
export const store = configureStore({ reducer: {
        auth: authReducer,
        transactions: transactionsReducer,
        authChat: authChatReducer,
    } });
