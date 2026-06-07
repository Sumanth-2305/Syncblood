import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A2535',
            color: '#E8EDF2',
            border: '1px solid #2A3A4A',
          },
          success: {
            iconTheme: { primary: '#4CAF50', secondary: '#1A2535' },
          },
          error: {
            iconTheme: { primary: '#EF5350', secondary: '#1A2535' },
          },
        }}
      />
    </AuthProvider>
  </StrictMode>
);
