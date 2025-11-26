import { initializeState } from '@state/init';
import { createStore, Provider } from 'jotai';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.tsx';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('root element not found');
}
const store = createStore();
initializeState(store);

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
