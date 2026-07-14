import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { API_BASE_URL } from './config/api';
import { GoogleOAuthProvider } from '@react-oauth/google';

axios.defaults.baseURL = API_BASE_URL;

const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Auto-reload page when service worker updates and claims control
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
