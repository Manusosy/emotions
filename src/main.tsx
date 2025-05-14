import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { AuthProvider } from './hooks/use-auth';
import { initApiMocking, apiMock } from './mocks/api-mock';

// Force enable API mocking to immediately solve the connection issues
console.log('Initializing API mocking system');
initApiMocking();
apiMock.enable();

// Create the React root and render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConnectionProvider>
  </React.StrictMode>
);
