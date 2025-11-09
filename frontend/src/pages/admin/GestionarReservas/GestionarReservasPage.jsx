// src/pages/admin/GestionarReservasPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Tag, Plus, Search, Edit, Trash2, Filter, RefreshCw, FileText } from 'lucide-react';

const GestionarReservasPage = ({ user }) => {
  const [reservas, setReservas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simular la carga de datos
  useEffect(() => {
    const cargarReservas = async () => {
      setLoading(true);
      try {
        // Datos simulados
        setReservas([
          { 
            id: 'RES001', 
            cliente: 'Carlos ApellidoCarlos', 
            recurso: 'Cuatrimoto Todo Terreno', 
            fechaInicio: '2025-11-15', 
            fechaFin: '2025-11-17', 
            estado: 'Confirmada', 
            monto: 450.00 
          },
          { 
            id: 'RES002', 
            cliente: 'Ana ApellidoAna', 
            recurso: 'Kayak Doble', 
            fechaInicio: '2025-11-20', 
            fechaFin: '2025-11-22', 
            estado: 'Pendiente', 
            monto: 180.00 
          },
          { 
            id: 'RES003', 
            cliente: 'Luis Quispe', 
            recurso: 'Bicicleta Montaña', 
            fechaInicio: '2025-11-10', 
            fechaFin: '2025-11-10', 
            estado: 'Cancelada', 
            monto: 60.00 
          },
        ]);
      } catch (err) {
        console.error('Error al cargar reservas:', err);
        setError('No se pudieron cargar las reservas.');
      } finally {
        setLoading(false);
      }
    };

    cargarReservas();
  }, []);

  // Filtrar reservas por búsqueda
  const filteredReservas = reservas.filter(reserva =>
    reserva.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Componente para la tabla de reservas
  const ReservasTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Reservas Recientes</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Ver todos
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Reserva</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurso(s)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReservas.map((reserva) => (
              <tr key={reserva.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{reserva.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{reserva.cliente}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{reserva.recurso}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{reserva.fechaInicio} - {reserva.fechaFin}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    reserva.estado === 'Confirmada' ? 'bg-green-100 text-green-800' :
                    reserva.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reserva.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  S/. {reserva.monto.toFixed(2)}
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
        <h1 className="text-3xl font-bold text-gray-900">Gestionar Reservas</h1>
        <p className="text-gray-600 mt-2">Registra y gestiona las reservas de recursos turísticos.</p>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre del cliente o ID de reserva..."
            className="flex-1 outline-none text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de reservas */}
      <ReservasTable />

      {/* Botón para crear nueva reserva (opcional) */}
      <div className="mt-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Crear Nueva Reserva
        </button>
      </div>
    </div>
  );
};

export default GestionarReservasPage;