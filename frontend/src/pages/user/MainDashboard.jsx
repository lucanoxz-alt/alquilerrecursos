// src/pages/MainDashboard.jsx
import React, { useState } from 'react';
import AdminSidebar from "../admin/AdminSidebar";
import JefeDashboard from "../jefe/JefeDashboard";
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


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <JefeDashboard />;
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
        return <JefeDashboard />;
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