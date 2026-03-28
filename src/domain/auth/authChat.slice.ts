import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AuthChatState, ChatMessage, SignInPayload } from './authChat.types';
import { signInWithAgent } from './authChat.services';
import { setSession } from '@/domain/auth/authSlice';

const initialState: AuthChatState = {
    chatId: null,
    messages: [],
    loading: false,
    error: null,
};

export const startSignInChat = createAsyncThunk(
    'authChat/start',
    async (_, { rejectWithValue }) => {
        try {
            return await signInWithAgent({ dashboard: 'Leo', chatData: [] });
        } catch (e: any) {
            return rejectWithValue(e?.message ?? 'Failed to start chat');
        }
    }
);

export const sendSignInMessage = createAsyncThunk(
    'authChat/send',
    async (
        message: string,
        { getState, rejectWithValue, dispatch }
    ) => {
        try {
            const state: any = getState();
            const { chatId, messages } = state.authChat as AuthChatState;

            const agent = messages
                .slice()
                .reverse()
                .find((m: any) => 'agent' in m) as any;

            const lastAgent: any = agent?.agent;

            const stage = lastAgent?.stage;
            const sort = typeof lastAgent?.sort === 'number' ? lastAgent.sort : 0;
            const flow = lastAgent?.flow ?? 'sign-in';

            const payload: SignInPayload = {
                ...(chatId ? { chatId } : {}),
                dashboard: 'Leo',
                chatData: [
                    ...messages,
                    {
                        user: { message, stage, sort: sort + 1, flow },
                    },
                ],
            };

            const data = await signInWithAgent(payload);

            const metadata = data?.data?.data?.metadata;
            if (metadata?.accessToken && metadata?.refreshToken) {
                // store tokens in your existing auth slice
                dispatch(
                    setSession({
                        user: metadata.user,
                        tokens: {
                            accessToken: metadata.accessToken,
                            refreshToken: metadata.refreshToken,
                        },
                    })
                );
            }

            return data;
        } catch (e: any) {
            return rejectWithValue(e?.message ?? 'Failed to send');
        }
    }
);

const authChatSlice = createSlice({
    name: 'authChat',
    initialState,
    reducers: {
        resetAuthChat: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(startSignInChat.pending, (s) => {
                s.loading = true;
                s.error = null;
            })
            .addCase(startSignInChat.fulfilled, (s, a: any) => {
                s.loading = false;

                const meta = a.payload?.data?.data?.metadata;
                if (meta?.chatId) s.chatId = meta.chatId;

                const chatData = a.payload?.data?.data?.chatData;
                if (Array.isArray(chatData)) {
                    s.messages = chatData.map((x: any, i: number) => ({
                        _id: x?._id ?? `${Date.now()}_${i}`,
                        ...x,
                    })) as ChatMessage[];
                }
            })
            .addCase(startSignInChat.rejected, (s, a: any) => {
                s.loading = false;
                s.error = a.payload ?? 'Failed';
            })
            .addCase(sendSignInMessage.pending, (s, a) => {
                s.loading = true;
                s.error = null;

                const msg = a.meta.arg;
                s.messages.push({
                    _id: `${Date.now()}_user`,
                    user: { message: msg, type: 'pending' },
                });
            })
            .addCase(sendSignInMessage.fulfilled, (s, a: any) => {
                s.loading = false;

                const meta = a.payload?.data?.data?.metadata;
                if (meta?.chatId) s.chatId = meta.chatId;

                const chatData = a.payload?.data?.data?.chatData;
                if (Array.isArray(chatData)) {
                    s.messages = chatData.map((x: any, i: number) => ({
                        _id: x?._id ?? `${Date.now()}_${i}`,
                        ...x,
                    })) as ChatMessage[];
                }
            })
            .addCase(sendSignInMessage.rejected, (s, a: any) => {
                s.loading = false;
                s.error = a.payload ?? 'Failed';

                // mark last user message as error
                for (let i = s.messages.length - 1; i >= 0; i--) {
                    const m: any = s.messages[i];
                    if (m.user?.type === 'pending') {
                        m.user.type = 'error';
                        break;
                    }
                }
            });
    },
});

export const { resetAuthChat } = authChatSlice.actions;
export default authChatSlice.reducer;
