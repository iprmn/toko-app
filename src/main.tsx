import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent pinch-to-zoom and multi-touch zoom gestures on mobile & tablet devices
if (typeof window !== 'undefined') {
  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
}

createRoot(document.getElementById('root')!).render(<App />);
