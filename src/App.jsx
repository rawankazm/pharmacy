import React, { Suspense, lazy, useEffect } from 'react';
import { downloadBackup } from './utils/backupService';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

import { KeyboardProvider } from './context/KeyboardContext';
import VirtualKeyboard from './components/VirtualKeyboard';

// Lazy load page components for better performance
// Helper to auto-reload page if a chunk fails to load (e.g. new deployment)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
        window.location.reload();
      }
      throw error;
    }
  });

const AdminProducts = lazyWithRetry(() => import('./pages/AdminProducts'));
const CashierPage = lazyWithRetry(() => import('./pages/CashierPage'));
const SalesPage = lazyWithRetry(() => import('./pages/SalesPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const ExpensesPage = lazyWithRetry(() => import('./pages/ExpensesPage'));
const WarehousePage = lazyWithRetry(() => import('./pages/WarehousePage'));
const IncomingMedicinesPage = lazyWithRetry(() => import('./pages/IncomingMedicinesPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const SuppliersPage = lazyWithRetry(() => import('./pages/SuppliersPage'));
const ExpiredProductsPage = lazyWithRetry(() => import('./pages/ExpiredProductsPage'));
const RolesPage = lazyWithRetry(() => import('./pages/RolesPage'));
const ShiftReportsPage = lazyWithRetry(() => import('./pages/ShiftReportsPage'));

// Simple loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

function App() {
  // Auto Backup Trigger
  useEffect(() => {
    const checkBackup = () => {
      const autoBackup = localStorage.getItem('settings_auto_backup') === 'true';
      if (autoBackup) {
        const last = localStorage.getItem('last_auto_backup');
        const now = Date.now();
        // Default 24 hours
        if (!last || (now - new Date(last).getTime() > 24 * 60 * 60 * 1000)) {
          // Trigger backup
          downloadBackup();
        }
      }
    };

    // Check on load
    checkBackup();
    // Check every hour
    const interval = setInterval(checkBackup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SocketProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <KeyboardProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/cashier" replace />} />

                {/* Cashier Routes */}
                <Route path="cashier" element={<CashierPage />} />

                <Route path="admin/products" element={<AdminProducts />} />
                <Route path="admin/expenses" element={<ExpensesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="warehouse" element={<WarehousePage />} />
                <Route path="incoming-medicines" element={<IncomingMedicinesPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="expired-products" element={<ExpiredProductsPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="shift-reports" element={<ShiftReportsPage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="*" element={<Navigate to="/cashier" replace />} />
              </Route>
            </Routes>
          </Suspense>
          <VirtualKeyboard />
        </BrowserRouter>
      </KeyboardProvider>
    </SocketProvider>
  );
}

export default App;
