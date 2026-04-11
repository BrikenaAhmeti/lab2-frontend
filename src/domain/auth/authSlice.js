import { createSlice } from '@reduxjs/toolkit';
const initialState = { user: null, tokens: null, finishedGetStarted: false };
const slice = createSlice({
    name: 'auth', initialState,
    reducers: {
        setSession: (s, a) => {
            s.user = a.payload.user;
            s.tokens = a.payload.tokens;
            localStorage.setItem('role', a.payload.user.role);
        },
        clearSession: (s) => { s.user = null; s.tokens = null; s.finishedGetStarted = false; localStorage.removeItem('role'); },
        markFinishedGetStarted: (s) => { s.finishedGetStarted = true; }
    }
});
export const { setSession, clearSession, markFinishedGetStarted } = slice.actions;
export default slice.reducer;
