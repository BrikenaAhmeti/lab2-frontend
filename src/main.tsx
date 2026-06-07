import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import '@/index.css';
import '@/config/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { applyTheme, getInitialTheme } from '@/config/theme';
import { setupAxiosInterceptors } from '@/lib/api/axios';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App';

applyTheme(getInitialTheme());
setupAxiosInterceptors(store);
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
