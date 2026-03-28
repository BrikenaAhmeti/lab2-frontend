import { test, expect } from 'vitest';
import reducer, { resetAuthChat } from '@/domain/auth/authChat.slice';

test('authChat reset returns initial state', () => {
    const state = reducer(
        { chatId: 'x', messages: [{ _id: '1', user: { message: 'hi' } }], loading: true, error: 'x' },
        resetAuthChat()
    );
    console.log(state, 'state')
    expect(state.chatId).toBe(null);
    expect(state.messages).toHaveLength(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
});
