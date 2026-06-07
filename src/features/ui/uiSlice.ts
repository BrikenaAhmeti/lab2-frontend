import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}

export interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toastQueue: ToastMessage[];
}

const initialState: UiState = {
  sidebarOpen: false,
  theme: 'system',
  toastQueue: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<UiState['theme']>) => {
      state.theme = action.payload;
    },
    enqueueToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'> & { id?: string }>) => {
      state.toastQueue.push({
        id: action.payload.id ?? crypto.randomUUID(),
        title: action.payload.title,
        description: action.payload.description,
        variant: action.payload.variant ?? 'info',
      });
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toastQueue = state.toastQueue.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toastQueue = [];
    },
  },
});

export const {
  openSidebar,
  closeSidebar,
  toggleSidebar,
  setTheme,
  enqueueToast,
  dismissToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
