// src/components/Dashboard.jsx
import React from 'react';
import { Package, DollarSign, Users, MapPin } from 'lucide-react';

const Dashboard = ({ stats, recentBookings }) => {
  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Bienvenido al Sistema de Gestión de Alquiler de Recursos Turísticos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          let IconComponent;
          switch (stat.icon) {
            case 'Package':
              IconComponent = Package;
              break;
            case 'DollarSign':
              IconComponent = DollarSign;
              break;
            case 'Users':
              IconComponent = Users;
              break;
            case 'MapPin':
              IconComponent = MapPin;
              break;
            default:
              IconComponent = () => null; // O un ícono por defecto
          }

          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                <span className="text-gray-500 text-sm ml-2">vs mes anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Alquileres Recientes</h3>
          <button className="text-blue-600 hover:text-blue-700 font-medium">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">ID Alquiler</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Recurso(s)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Monto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">{booking.id}</td>
                  <td className="py-3 px-4 text-gray-700">{booking.customer}</td>
                  <td className="py-3 px-4 text-gray-700">{booking.resource}</td>
                  <td className="py-3 px-4 text-gray-700">{booking.date}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{booking.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;