// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/shared/LoginForm';
import AdminLayout from './components/layout/RoleBasedLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import JefeDashboard from './pages/jefe/JefeDashboard';

// 🔧 Importaciones corregidas (apuntan a las subcarpetas)
import GestionarReservasPage from './pages/jefe/GestionarReservas/JefeGestionarReservasPage';
import GestionarPromocionesPage from './pages/jefe/GestionarPromociones/JefeGestionarPromocionesPage';
import MantenimientoDatosPage from './pages/jefe/MantenimientoDatos/JefeMantenimientoDatosPage';
import ReportesPage from './pages/jefe/Reportes/JefeReportesPage';
import ConfiguracionPage from './pages/jefe/Configuracion/JefeConfiguracionPage';
import EmpleadoDashboard from './pages/empleado/EmpleadoDashboard';
import EmpleadoAlquileresPage from './pages/empleado/Alquileres/EmpleadoAlquileresPage';
import EmpleadoReservasPage from './pages/empleado/Reservas/EmpleadoReservasPage';
import EmpleadoReportesPage from './pages/empleado/Reportes/EmpleadoReportesPage';
import EmpleadoPromocionesPage from './pages/empleado/Promociones/EmpleadoPromocionesPage';
// Rutas JEFE utilizarán directamente las páginas base en 'jefe'
// (admin reexporta desde jefe para compatibilidad)
import RequireRole from './components/RequireRole';
import NotAuthorized from './pages/NotAuthorized';

// Comentamos la importación de la página que aún no está lista
// import GestionarTiposRecursosPage from './pages/admin/GestionarTiposRecursosPage';
import GestionarAlquileresPage from './pages/admin/GestionarAlquileres/GestionarAlquileresPage';

// Nuevas páginas de mantenimiento de datos
import GestionClientes from './pages/jefe/MantenimientoDatos/Components/GestionClientes';
import GestionRecursos from './pages/jefe/MantenimientoDatos/Components/GestionRecursos';
import GestionTiposRecursos from './pages/jefe/MantenimientoDatos/Components/GestionTiposRecursos';
import GestionUsuarios from './pages/jefe/MantenimientoDatos/Components/GestionUsuarios';

// Debug log para verificar importación

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (userData && token) {
      const parsedUserData = JSON.parse(userData);
      setUser(parsedUserData);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  // Componente para rutas protegidas
  const PrivateRoute = ({ children }) => {
    const isAuthenticated = !!user;
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  // Componente para rutas públicas
  const PublicRoute = ({ children }) => {
    if (!user) return children;
    const role = String(user?.rol || user?.role || '').trim().toUpperCase();
    const defaultRoute = role === 'JEFE' ? '/jefe' : role === 'EMPLEADO' ? '/empleado' : '/admin';
    return <Navigate to={defaultRoute} />;
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
          <Route path="promociones" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><GestionarPromocionesPage user={user} /></RequireRole>} />
          <Route path="mantenimiento" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><MantenimientoDatosPage user={user} /></RequireRole>} />
          <Route path="mantenimiento/clientes" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><GestionClientes user={user} /></RequireRole>} />
          <Route path="mantenimiento/recursos" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><GestionRecursos user={user} /></RequireRole>} />
          <Route path="mantenimiento/tipos-recursos" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><GestionTiposRecursos user={user} /></RequireRole>} />
          <Route path="mantenimiento/usuarios" element={<RequireRole allowedRoles={['JEFE']}><GestionUsuarios user={user} /></RequireRole>} />
          <Route path="reportes" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><ReportesPage user={user} /></RequireRole>} />
          <Route path="configuracion" element={<RequireRole allowedRoles={['JEFE','ADMINISTRADOR']}><ConfiguracionPage user={user} /></RequireRole>} />
          {/* Comentamos la ruta temporalmente hasta que implementes la lógica en el backend */}
          {/* <Route path="tipos-recursos" element={<GestionarTiposRecursosPage user={user} />} /> */}
        </Route>

        {/* Ruta para Empleado con layout y página de índice */}
        <Route
          path="/empleado"
          element={
            <PrivateRoute>
              <AdminLayout user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          <Route index element={<EmpleadoDashboard user={user} />} />
          <Route path="alquileres" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><EmpleadoAlquileresPage user={user} /></RequireRole>} />
          <Route path="reservas" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><EmpleadoReservasPage user={user} /></RequireRole>} />
          <Route path="promociones" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><EmpleadoPromocionesPage user={user} /></RequireRole>} />
          <Route path="mantenimiento" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><MantenimientoDatosPage user={user} /></RequireRole>} />
          <Route path="mantenimiento/clientes" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><GestionClientes user={user} /></RequireRole>} />
          <Route path="mantenimiento/recursos" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><GestionRecursos user={user} /></RequireRole>} />
          <Route path="configuracion" element={<RequireRole allowedRoles={['EMPLEADO','JEFE','ADMINISTRADOR']}><ConfiguracionPage user={user} /></RequireRole>} />
          <Route path="reportes" element={<RequireRole allowedRoles={['EMPLEADO']}><EmpleadoReportesPage user={user} /></RequireRole>} />
        </Route>

        {/* Ruta para Jefe (usa páginas base en 'jefe') */}
        <Route
          path="/jefe"
          element={
            <PrivateRoute>
              <AdminLayout user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          <Route index element={<RequireRole allowedRoles={["JEFE"]}><JefeDashboard user={user} /></RequireRole>} />
          <Route path="alquileres" element={<RequireRole allowedRoles={["JEFE"]}><GestionarAlquileresPage user={user} /></RequireRole>} />
          <Route path="reservas" element={<RequireRole allowedRoles={["JEFE"]}><GestionarReservasPage user={user} /></RequireRole>} />
          <Route path="promociones" element={<RequireRole allowedRoles={["JEFE"]}><GestionarPromocionesPage user={user} /></RequireRole>} />
          <Route path="mantenimiento" element={<RequireRole allowedRoles={["JEFE"]}><MantenimientoDatosPage user={user} /></RequireRole>} />
          <Route path="mantenimiento/clientes" element={<RequireRole allowedRoles={["JEFE"]}><GestionClientes user={user} /></RequireRole>} />
          <Route path="mantenimiento/recursos" element={<RequireRole allowedRoles={["JEFE"]}><GestionRecursos user={user} /></RequireRole>} />
          <Route path="mantenimiento/tipos-recursos" element={<RequireRole allowedRoles={["JEFE"]}><GestionTiposRecursos user={user} /></RequireRole>} />
          <Route path="mantenimiento/usuarios" element={<RequireRole allowedRoles={["JEFE"]}><GestionUsuarios user={user} /></RequireRole>} />
          <Route path="reportes" element={<RequireRole allowedRoles={["JEFE"]}><ReportesPage user={user} /></RequireRole>} />
          <Route path="configuracion" element={<RequireRole allowedRoles={["JEFE"]}><ConfiguracionPage user={user} /></RequireRole>} />
        </Route>

        <Route path="/not-authorized" element={<NotAuthorized />} />
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}