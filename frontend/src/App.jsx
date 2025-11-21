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

// Nuevas páginas de mantenimiento de datos
import GestionClientes from './pages/admin/MantenimientoDatos/GestionClientes';
import GestionRecursos from './pages/admin/MantenimientoDatos/GestionRecursos';
import GestionTiposRecursos from './pages/admin/MantenimientoDatos/GestionTiposRecursos';
import GestionUsuarios from './pages/admin/MantenimientoDatos/GestionUsuarios';

// Debug log para verificar importación
console.log('🔍 GestionarAlquileresPage importado:', GestionarAlquileresPage);

export default function App() {
  console.log('🔥 APP.JSX CARGADO - ARCHIVO MODIFICADO 🔥');
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('🔄 Verificando userData en localStorage...');
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    console.log('🔄 userData encontrado:', userData);
    console.log('🔄 token encontrado:', token ? 'Sí' : 'No');
    
    if (userData && token) {
      const parsedUserData = JSON.parse(userData);
      console.log('🔄 Configurando usuario:', parsedUserData);
      setUser(parsedUserData);
    }
  }, []);

  const handleLogin = (userData) => {
    console.log('🔄 handleLogin llamado con:', userData);
    setUser(userData);
    
    // Verificar que se guardó correctamente
    setTimeout(() => {
      const savedUserData = localStorage.getItem('userData');
      const savedToken = localStorage.getItem('authToken');
      console.log('🔄 Verificación post-login - userData:', savedUserData);
      console.log('🔄 Verificación post-login - token:', savedToken);
    }, 100);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  // Componente para rutas protegidas
  const PrivateRoute = ({ children }) => {
    console.log('🔒 PrivateRoute - Usuario actual:', user);
    const isAuthenticated = !!user;
    console.log('🔒 PrivateRoute - Está autenticado:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('🔒 PrivateRoute - Redirigiendo a login');
      return <Navigate to="/login" />;
    }
    
    return children;
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
          <Route path="mantenimiento/clientes" element={<GestionClientes user={user} />} />
          <Route path="mantenimiento/recursos" element={<GestionRecursos user={user} />} />
          <Route path="mantenimiento/tipos-recursos" element={<GestionTiposRecursos user={user} />} />
          <Route path="mantenimiento/usuarios" element={<GestionUsuarios user={user} />} />
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