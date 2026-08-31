import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './app/App';
import { RingSessionProvider } from './features/ring/sessionContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RingSessionProvider>
        <App />
      </RingSessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
