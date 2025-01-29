import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import './index.css';
import { WebAppProvider } from '@vkruglikov/react-telegram-web-app';

// Type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: string;
          hash?: string;
          start_param?: string;
        };
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        platform: string;
        version: string;
        colorScheme: string;
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
        viewportHeight: number;
        viewportStableHeight: number;
      };
    };
  }
}

// Get init data from URL
const searchParams = new URLSearchParams(window.location.search);
const initData = searchParams.get('tgWebAppData') || '';

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root')!);

// Render app with WebAppProvider
root.render(
  <StrictMode>
    <WebAppProvider options={{ 
      smoothButtonsTransition: true,
      initDataUnsafe: initData ? JSON.parse(decodeURIComponent(initData)) : undefined
    }}>
      <App />
    </WebAppProvider>
  </StrictMode>
);
