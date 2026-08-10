import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Không tìm thấy phần tử #root trong index.html');

// Mounted here rather than inside App so the quiz and its tests never load the
// Vercel packages. Both render nothing and no-op outside a Vercel deployment.
createRoot(container).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
