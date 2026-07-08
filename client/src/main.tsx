import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#ff90e8',
          colorBackground: '#f4f4f0',
          colorText: '#242423',
          borderRadius: '4px',
          fontFamily: '"ABC Favorit", "Plus Jakarta Sans", Avenir, Montserrat, sans-serif',
        },
        elements: {
          card: 'border-2 border-[#242423] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          formButtonPrimary: 'bg-[#ff90e8] border-2 border-[#242423] text-[#242423] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all',
          footerActionLink: 'text-[#ff90e8] font-bold',
          headerTitle: 'font-bold',
        },
      }}
    >
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#242423',
              color: '#f4f4f0',
              border: '2px solid #242423',
              borderRadius: '4px',
              fontFamily: '"ABC Favorit", sans-serif',
              fontWeight: 700,
            },
          }}
        />
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
