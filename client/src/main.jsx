import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './redux/store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1c2e1f',
              color: '#f0ede4',
              border: '1px solid #2a3f2d',
              fontFamily: 'Source Sans 3, sans-serif',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#0d1b12' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0d1b12' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
