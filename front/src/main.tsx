import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

/** VK WebView и кросс-сайт: без этого cookie сессии часто не уходит → 401 на всех /api. */
const __nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) =>
  __nativeFetch(input, {
    ...init,
    credentials: init?.credentials ?? 'include',
  });

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
