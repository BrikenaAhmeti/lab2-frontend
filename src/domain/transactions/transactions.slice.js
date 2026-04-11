import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { TransactionsApi } from './transactions.api';
const initialState = { page: null, byId: {}, loading: false };
export const fetchTransactions = createAsyncThunk('transactions/fetch', async ({ page = 1, pageSize = 20 }) => TransactionsApi.list(page, pageSize));
export const fetchTransaction = createAsyncThunk('transactions/get', async (id) => TransactionsApi.get(id));
export const createTransaction = createAsyncThunk('transactions/create', async (payload) => TransactionsApi.create(payload));
export const updateTransaction = createAsyncThunk('transactions/update', async ({ id, payload }) => TransactionsApi.update(id, payload));
export const deleteTransaction = createAsyncThunk('transactions/delete', async (id) => { await TransactionsApi.remove(id); return id; });
const slice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {},
    extraReducers: (b) => {
        b.addCase(fetchTransactions.pending, (s) => { s.loading = true; s.error = undefined; })
            .addCase(fetchTransactions.fulfilled, (s, a) => {
            s.loading = false;
            s.page = a.payload;
            for (const t of a.payload.items)
                s.byId[t.id] = t;
        })
            .addCase(fetchTransactions.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
            .addCase(fetchTransaction.fulfilled, (s, a) => { s.byId[a.payload.id] = a.payload; })
            .addCase(createTransaction.fulfilled, (s, a) => {
            const t = a.payload;
            s.byId[t.id] = t;
            if (s.page) {
                s.page.items = [t, ...s.page.items];
                s.page.total += 1;
            }
        })
            .addCase(updateTransaction.fulfilled, (s, a) => {
            s.byId[a.payload.id] = a.payload;
            if (s.page)
                s.page.items = s.page.items.map(x => x.id === a.payload.id ? a.payload : x);
        })
            .addCase(deleteTransaction.fulfilled, (s, a) => {
            delete s.byId[a.payload];
            if (s.page) {
                s.page.items = s.page.items.filter(x => x.id !== a.payload);
                s.page.total -= 1;
            }
        });
    }
});
export default slice.reducer;
