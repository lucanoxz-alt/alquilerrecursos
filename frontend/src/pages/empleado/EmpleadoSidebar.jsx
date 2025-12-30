// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Calendar, Tag, Database, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();

  const roleNormalized = (user?.rol || user?.role || '').toString().trim().toUpperCase();
  const baseRoot = roleNormalized === 'JEFE' ? '/jefe' : roleNormalized === 'EMPLEADO' ? '/empleado' : '/admin';

  // Menú específico por rol
  const roleMenus = {
    JEFE: [
      { name: 'Dashboard', icon: Home, path: `${baseRoot}` },
      { name: 'Gestionar Alquileres', icon: Package, path: `${baseRoot}/alquileres` },
      { name: 'Gestionar Reservas', icon: Calendar, path: `${baseRoot}/reservas` },
      { name: 'Gestionar Promociones', icon: Tag, path: `${baseRoot}/promociones` },
      { name: 'Mantenimiento de Datos', icon: Database, path: `${baseRoot}/mantenimiento` },
      { name: 'Reportes', icon: FileText, path: `${baseRoot}/reportes` },
      { name: 'Configuración', icon: Settings, path: `${baseRoot}/configuracion` },
    ],
    ADMINISTRADOR: [
      { name: 'Dashboard', icon: Home, path: `${baseRoot}` },
      { name: 'Gestionar Alquileres', icon: Package, path: `${baseRoot}/alquileres` },
      { name: 'Gestionar Reservas', icon: Calendar, path: `${baseRoot}/reservas` },
      { name: 'Gestionar Promociones', icon: Tag, path: `${baseRoot}/promociones` },
      { name: 'Mantenimiento de Datos', icon: Database, path: `${baseRoot}/mantenimiento` },
      { name: 'Reportes', icon: FileText, path: `${baseRoot}/reportes` },
      { name: 'Configuración', icon: Settings, path: `${baseRoot}/configuracion` },
    ],
    EMPLEADO: [
      { name: 'Dashboard', icon: Home, path: `${baseRoot}` },
      { name: 'Alquileres', icon: Package, path: `${baseRoot}/alquileres` },
      { name: 'Reservas', icon: Calendar, path: `${baseRoot}/reservas` },
      { name: 'Promociones', icon: Tag, path: `${baseRoot}/promociones` },
      { name: 'Mantenimiento', icon: Database, path: `${baseRoot}/mantenimiento` },
      { name: 'Reportes', icon: FileText, path: `${baseRoot}/reportes` },
      { name: 'Configuración', icon: Settings, path: `${baseRoot}/configuracion` },
    ],
  };

  const menuItems = roleMenus[roleNormalized] || roleMenus.ADMINISTRADOR;

  // Mostrar nombre del usuario y rol en la parte inferior
  const displayName = user?.nombre || user?.username || 'Usuario';
  const displayRole = (user?.rol || user?.role || '').toString().toUpperCase();

  const isActiveItem = (itemPath) => {
    if (!itemPath) return false;
    if (itemPath === baseRoot) {
      return location.pathname === baseRoot;
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <div className="relative w-64 bg-gray-900 text-white min-h-screen p-6">
      <div className="flex items-center mb-8 gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-gray-200">
          <img src="/web-app-manifest-192x192.png" alt="Adventure ATV" className="w-8 h-8 object-contain" />
        </div>
        <h1 className="text-xl font-bold">SGART</h1>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = isActiveItem(item.path);

          return item.path ? (
            <Link
              key={item.name}
              to={item.path}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ) : null;
        })}

        <button
          onClick={onLogout}
          className="mt-4 w-full flex items-center p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-sm text-gray-300">
            <div className="font-medium">{displayName}</div>
            <div className="text-xs text-gray-400">{displayRole}</div>
          </div>
        </div>
      </nav>
    </div>
  );
}
