// src/pages/MainDashboard.jsx
import React, { useState } from 'react';
import AdminSidebar from "../admin/AdminSidebar";
import Dashboard from "../../components/Dashboard";
import GestionarAlquileresPage from "../admin/GestionarAlquileres/GestionarAlquileresPage";

// 👇 Componentes temporales (crearemos uno por cada módulo)
const PlaceholderPage = ({ title }) => (
  <div className="ml-64 p-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
    <p className="text-gray-600">Esta sección está en desarrollo.</p>
  </div>
);

const MainDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { title: 'Total Alquileres', value: '124', change: '+12%', icon: 'Package', color: 'bg-blue-500' },
    { title: 'Ingresos Totales', value: 'S/ 24,560', change: '+8.5%', icon: 'DollarSign', color: 'bg-green-500' },
    { title: 'Clientes Activos', value: '89', change: '+5%', icon: 'Users', color: 'bg-purple-500' },
    { title: 'Recursos Disponibles', value: '42', change: '-2%', icon: 'MapPin', color: 'bg-orange-500' }
  ];

  const recentBookings = [
    { id: 'ALQ001', customer: 'Carlos ApellidoCarlos', resource: 'Cuatrimoto Todo Terreno', date: '2025-10-20', amount: 'S/ 220.00', status: 'Finalizado' },
    { id: 'ALQ002', customer: 'Ana ApellidoAna', resource: 'Cuatrimoto TT + Moto Acuática', date: '2025-10-28', amount: 'S/ 220.00', status: 'Activo' },
    { id: 'ALQ003', customer: 'María ApellidoMaria', resource: 'Kitesurf', date: '2025-10-21', amount: 'S/ 324.00', status: 'Finalizado' },
    { id: 'ALQ004', customer: 'James ApellidoJames', resource: 'Moto Acuática', date: '2025-10-22', amount: 'S/ 100.00', status: 'Activo' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} recentBookings={recentBookings} />;
      case 'alquileres':
        return <GestionarAlquileresPage />;
      case 'reservas':
        return <PlaceholderPage title="Gestionar Reservas" />;
      case 'promociones':
        return <PlaceholderPage title="Gestionar Promociones" />;
      case 'mantenimiento':
        return <PlaceholderPage title="Mantenimiento de Datos" />;
      case 'reportes':
        return <PlaceholderPage title="Reportes" />;
      case 'configuracion':
        return <PlaceholderPage title="Configuración" />;
      default:
        return <Dashboard stats={stats} recentBookings={recentBookings} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={{ rol: 'ADMINISTRADOR' }} onLogout={onLogout} />
      {renderContent()}
    </div>
  );
};

export default MainDashboard;