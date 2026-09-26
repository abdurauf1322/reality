
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Debts from './pages/Debts';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Backup from './pages/Backup';
import Settings from './pages/Settings';

import { LockScreen } from './components/LockScreen';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <LockScreen>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="customers" element={<Customers />} />
            <Route path="debts" element={<Debts />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="backup" element={<Backup />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </LockScreen>
    </Router>
  );
}

export default App;
