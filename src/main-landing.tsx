import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './components/landing/LandingPage';
import { MaintenanceGate } from '@/hooks/useMaintenance';
import { MaintenancePage } from '@/components/landing/MaintenancePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MaintenanceGate fallback={<MaintenancePage />}>
      <LandingPage />
    </MaintenanceGate>
  </React.StrictMode>
);