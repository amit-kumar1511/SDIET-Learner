import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { API_BASE_URL } from './config/api';

axios.defaults.baseURL = API_BASE_URL;

const updateSW = registerSW({
  onNeedRefresh() {
    // Optional: Show a prompt to the user to refresh the page
  },
  onOfflineReady() {
    // Optional: Show a message that the app is ready to work offline
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
