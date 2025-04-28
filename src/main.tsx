import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Make supabase globally available for document download
import { supabase } from './services/supabase';
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}
window.supabase = supabase;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);