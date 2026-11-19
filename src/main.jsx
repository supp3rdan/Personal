import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './state/store.jsx';
import { TimerProvider } from './state/timer.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  // Sem StrictMode: o efeito duplo dele em dev bagunça o histórico usado pelo "voltar" dos modais
  <StoreProvider>
    <TimerProvider>
      <App />
    </TimerProvider>
  </StoreProvider>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
