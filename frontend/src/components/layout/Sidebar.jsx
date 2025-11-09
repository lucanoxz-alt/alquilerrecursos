// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, Calendar, Tag, Database, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
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

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <div className="flex items-center mb-8">
        <div className="bg-blue-600 p-2 rounded-lg mr-3">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold">SGART</h1>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={item.onClick}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              item.name === 'Dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}