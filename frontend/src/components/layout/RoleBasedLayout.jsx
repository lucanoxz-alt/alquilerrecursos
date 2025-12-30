// src/components/layout/RoleBasedLayout.jsx

// Importamos React (necesario para componentes JSX)
import React from 'react';

// Importamos los sidebars según el rol del usuario
// @ es un alias que normalmente apunta a "src/"
import AdminSidebar from '@/pages/admin/AdminSidebar';
import EmpleadoSidebar from '@/pages/empleado/EmpleadoSidebar';
import JefeSidebar from '@/pages/jefe/JefeSidebar';

// Outlet permite renderizar las rutas hijas dentro del layout
import { Outlet } from 'react-router-dom';

/**
 * Componente AdminLayout
 * ----------------------
 * Este layout envuelve todas las páginas protegidas.
 * Muestra un sidebar distinto según el rol del usuario
 * y renderiza la página correspondiente usando <Outlet />.
 */
export default function AdminLayout({ user, onLogout }) {

  // Obtenemos el rol del usuario desde el objeto user
  // Puede venir como "rol" o "role" según el backend
  // Se convierte a string, se eliminan espacios y se pasa a mayúsculas
  const role = (user?.rol || user?.role || '')
    .toString()
    .trim()
    .toUpperCase();

  /**
   * Selección dinámica del Sidebar:
   * - JEFE      → JefeSidebar
   * - EMPLEADO  → EmpleadoSidebar
   * - Cualquier otro → AdminSidebar
   */
  const Sidebar =
    role === 'JEFE'
      ? JefeSidebar
      : role === 'EMPLEADO'
        ? EmpleadoSidebar
        : AdminSidebar;

  return (
    // Contenedor principal con flexbox
    // min-h-screen: ocupa toda la altura de la pantalla
    // bg-gray-50: fondo claro
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar dinámico según el rol */}
      <Sidebar
        user={user}
        onLogout={onLogout}
      />

      {/* Contenedor del contenido principal */}
      <div className="flex-1">

        {/* 
          Outlet renderiza aquí la página hija activa
          Ejemplo:
          /jefe/configuracion → ConfiguracionPage
          /empleado/alquileres → EmpleadoAlquileresPage
        */}
        <Outlet />

      </div>
    </div>
  );
}
