import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AlertProvider } from './contexts/AlertContext';
import Login from './components/Login';
import Navigation from './components/Navigation';
import EventPage from './pages/EventPage';
import NuestraHistoriaPage from './pages/NuestraHistoriaPage';
import GiftsPage from './pages/GiftsPage';
import DedicationsPage from './pages/DedicationsPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import Cart from './components/Cart';
import { config } from './config';

const AppContent: React.FC = () => {
  // Siempre iniciar con 'evento' como página por defecto
  const [activeTab, setActiveTab] = useState('evento');
  const { loading } = useAuth();

  // Actualizar título del navegador dinámicamente
  useEffect(() => {
    document.title = config.wedding.title;
  }, []);
  
  // Actualizar localStorage cuando cambia la pestaña activa
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Escuchar eventos personalizados para cambiar de pestaña
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('tabChange', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener);
    };
  }, []);

  // Verificar acceso a pestañas restringidas
  const { user } = useAuth();
  useEffect(() => {
    // Si el usuario intenta acceder a reportes o admin sin ser admin, redirigir a evento
    if ((activeTab === 'reportes' || activeTab === 'admin') && user?.role !== 'admin') {
      setActiveTab('evento');
    }
  }, [activeTab, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
      </div>
    );
  }

  return (
    <AlertProvider>
      <CartProvider>
        <div className="min-h-screen bg-transparent">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="py-8">
            {activeTab === 'evento' && <EventPage />}
            {activeTab === 'nuestra-historia' && <NuestraHistoriaPage />}
            {activeTab === 'regalos' && <GiftsPage />}
            {activeTab === 'dedicatorias' && <DedicationsPage />}
            {activeTab === 'reportes' && <ReportsPage />}
            {activeTab === 'admin' && <AdminPage />}
          </main>

          <Cart />
        </div>
      </CartProvider>
    </AlertProvider>
  );
};

// Componente para proteger rutas de admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Componente para la página principal (invitados sin login)
const MainApp: React.FC = () => {
  return <AppContent />;
};

// Componente para la página de login de admin
const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
      </div>
    );
  }
  
  // Si ya está autenticado como admin, redirigir a admin
  if (isAuthenticated && user?.role === 'admin') {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Login isAdminLogin={true} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <AdminRoute>
              <MainApp />
            </AdminRoute>
          } />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
