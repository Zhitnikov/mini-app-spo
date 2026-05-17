import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { getSessionToken } from './lib/sessionToken';

const __nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const requestUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  const isSameOrigin =
    requestUrl.startsWith('/') ||
    requestUrl.startsWith(window.location.origin);

  const isApi = isSameOrigin && requestUrl.includes('/api/');
  const headers = new Headers(init?.headers);
  if (isApi) {
    const token = getSessionToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return __nativeFetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? (isSameOrigin ? 'include' : 'same-origin'),
  });
};

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
