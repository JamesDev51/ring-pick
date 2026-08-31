import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { WeddingBandSessionProvider } from './features/wedding-band/sessionContext';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WeddingBandSessionProvider>
        <App />
      </WeddingBandSessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
