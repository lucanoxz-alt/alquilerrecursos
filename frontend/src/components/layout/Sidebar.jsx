// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Calendar, Tag, Database, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/admin' },
    { name: 'Gestionar Alquileres', icon: Package, path: '/admin/alquileres' },
    { name: 'Gestionar Reservas', icon: Calendar, path: '/admin/reservas' },
    { name: 'Gestionar Promociones', icon: Tag, path: '/admin/promociones' },
    { name: 'Mantenimiento de Datos', icon: Database, path: '/admin/mantenimiento' },
    { name: 'Reportes', icon: FileText, path: '/admin/reportes' },
    { name: 'Configuración', icon: Settings, path: '/admin/configuracion' },
    { name: 'Cerrar Sesión', icon: LogOut, onClick: onLogout }
  ];

  const isActiveItem = (itemPath) => {
    if (itemPath === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <div className="flex items-center mb-8 gap-3">
        <img src="/favicon.svg" alt="Adventure ATV" className="w-10 h-10" />
        <h1 className="text-2xl font-bold leading-none">SGART</h1>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = item.path ? isActiveItem(item.path) : false;
          
          if (item.name === 'Cerrar Sesión') {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="w-full flex items-center p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}