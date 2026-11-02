import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import EmergencyPage from './EmergencyPage';

// Entry for emergency.html. The portfolio also serves the page at /emergency
// through App.jsx; this one skips everything else the portfolio loads.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EmergencyPage />
  </StrictMode>,
);
