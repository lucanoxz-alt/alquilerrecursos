// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Users, MapPin, Plus, Search, Edit, Trash2, Filter, RefreshCw } from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalAlquileres: 0,
    ingresosTotales: 0,
    clientesActivos: 0,
    recursosDisponibles: 0
  });
  const [alquileres, setAlquileres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simular la carga de datos del dashboard
  useEffect(() => {
    const cargarDatos = async () => {
      // Datos simulados
      setStats({
        totalAlquileres: 124,
        ingresosTotales: 24560,
        clientesActivos: 89,
        recursosDisponibles: 42
      });

      setAlquileres([
        { id: 'ALQ001', cliente: 'Carlos ApellidoCarlos', recurso: 'Cuatrimoto Todo Terreno', fecha: '2025-10-20', monto: 220.00, estado: 'Finalizado' },
        { id: 'ALQ002', cliente: 'Ana ApellidoAna', recurso: 'Cuatrimoto TT + Moto Acuática', fecha: '2025-10-28', monto: 220.00, estado: 'Activo' },
        { id: 'ALQ003', cliente: 'María ApellidoMaría', recurso: 'Kitesurf', fecha: '2025-10-21', monto: 324.00, estado: 'Finalizado' },
        { id: 'ALQ004', cliente: 'James ApellidoJames', recurso: 'Moto Acuática', fecha: '2025-10-22', monto: 100.00, estado: 'Activo' },
      ]);

      setLoading(false);
    };

    cargarDatos();
  }, []);

  // Componente para las tarjetas de estadísticas
  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} <span className="text-gray-500">vs mes anterior</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 border border-${color}-200 shadow-sm`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  // Componente para la tabla de alquileres recientes
  const RecentBookingsTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Alquileres Recientes</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Ver todos
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Alquiler</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurso(s)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alquileres.map((alquiler) => (
              <tr key={alquiler.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{alquiler.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{alquiler.cliente}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{alquiler.recurso}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{alquiler.fecha}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  S/. {alquiler.monto.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    alquiler.estado === 'Activo' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {alquiler.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al Sistema de Gestión de Alquiler de Recursos Turísticos</p>
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Alquileres"
          value={stats.totalAlquileres}
          change="+12%"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Ingresos Totales"
          value={`S/. ${stats.ingresosTotales}`}
          change="+8.5%"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Clientes Activos"
          value={stats.clientesActivos}
          change="+5%"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Recursos Disponibles"
          value={stats.recursosDisponibles}
          change="-2%"
          icon={MapPin}
          color="orange"
        />
      </div>

      {/* Tabla de alquileres recientes */}
      <RecentBookingsTable />
    </div>
  );
};

export default AdminDashboard;