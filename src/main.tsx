import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AdminAuthProvider } from '@/hooks/useAdminAuth';
import { ToastProvider } from '@/hooks/useToast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AdminAuthProvider>
  </React.StrictMode>
);