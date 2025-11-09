// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/shared/LoginForm';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

// 🔧 Importaciones corregidas (apuntan a las subcarpetas)
import GestionarReservasPage from './pages/admin/GestionarReservas/GestionarReservasPage';
import GestionarPromocionesPage from './pages/admin/GestionarPromociones/GestionarPromocionesPage';
import MantenimientoDatosPage from './pages/admin/MantenimientoDatos/MantenimientoDatosPage';
import ReportesPage from './pages/admin/Reportes/ReportesPage';
import ConfiguracionPage from './pages/admin/Configuracion/ConfiguracionPage';

// Comentamos la importación de la página que aún no está lista
// import GestionarTiposRecursosPage from './pages/admin/GestionarTiposRecursosPage';
import GestionarAlquileresPage from './pages/admin/GestionarAlquileres/GestionarAlquileresPage';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('authToken', userData.token);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  // Componente para rutas protegidas
  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  // Componente para rutas públicas
  const PublicRoute = ({ children }) => {
    return !user ? children : <Navigate to="/admin" />;
  };

  return (
    <Router>
      <Routes>
        {/* Ruta pública: Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm onLogin={handleLogin} />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard user={user} />} /> {/* Página por defecto */}

          <Route path="alquileres" element={<GestionarAlquileresPage user={user} />} />
          <Route path="reservas" element={<GestionarReservasPage user={user} />} />
          <Route path="promociones" element={<GestionarPromocionesPage user={user} />} />
          <Route path="mantenimiento" element={<MantenimientoDatosPage user={user} />} />
          <Route path="reportes" element={<ReportesPage user={user} />} />
          <Route path="configuracion" element={<ConfiguracionPage user={user} />} />
          {/* Comentamos la ruta temporalmente hasta que implementes la lógica en el backend */}
          {/* <Route path="tipos-recursos" element={<GestionarTiposRecursosPage user={user} />} /> */}
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}