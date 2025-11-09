// src/pages/admin/ReportesPage.jsx
import React, { useState } from 'react';
import { FileText, Calendar, Filter, Download, BarChart3, Users, Package, TrendingUp } from 'lucide-react';

const ReportesPage = ({ user }) => {
  const [reportType, setReportType] = useState('alquileres');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Tipos de reporte disponibles
  const reportOptions = [
    { id: 'alquileres', name: 'Alquileres', icon: Package },
    { id: 'reservas', name: 'Reservas', icon: Calendar },
    { id: 'ingresos', name: 'Ingresos', icon: TrendingUp },
    { id: 'clientes', name: 'Clientes', icon: Users },
  ];

  // Datos simulados para el reporte seleccionado
  const reportData = {
    alquileres: [
      { id: 'ALQ001', cliente: 'Carlos Mendoza', recurso: 'Quad 400cc', fecha: '2025-10-20', monto: 450.00 },
      { id: 'ALQ002', cliente: 'Ana Torres', recurso: 'Kayak Doble', fecha: '2025-10-25', monto: 180.00 },
      { id: 'ALQ003', cliente: 'Luis Quispe', recurso: 'Bicicleta Montaña', fecha: '2025-10-28', monto: 60.00 },
    ],
    reservas: [
      { id: 'RES001', cliente: 'María López', recurso: 'Stand Up Paddle', fecha: '2025-11-05', estado: 'Confirmada' },
      { id: 'RES002', cliente: 'James Smith', recurso: 'Moto Acuática', fecha: '2025-11-10', estado: 'Pendiente' },
    ],
    ingresos: [
      { mes: 'Octubre 2025', total: 8450.00, alquileres: 24 },
      { mes: 'Septiembre 2025', total: 7200.00, alquileres: 21 },
    ],
    clientes: [
      { nombre: 'Carlos Mendoza', alquileres: 3, ultimaVisita: '2025-10-28' },
      { nombre: 'Ana Torres', alquileres: 2, ultimaVisita: '2025-10-25' },
    ],
  };

  const currentData = reportData[reportType] || [];

  // Renderizar tabla según el tipo de reporte
  const renderTable = () => {
    if (reportType === 'alquileres') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Alquiler</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto (S/.)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.recurso}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fecha}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.monto.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'reservas') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Reserva</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.recurso}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fecha}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {item.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'ingresos') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ingresos (S/.)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Alquileres</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.mes}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.alquileres}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'clientes') {
      return (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Alquileres</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Visita</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.alquileres}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ultimaVisita}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-2">Genera y visualiza reportes de alquileres, reservas, ingresos y más.</p>
      </div>

      {/* Filtros superiores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
            <div className="space-y-2">
              {reportOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setReportType(opt.id)}
                    className={`w-full flex items-center p-3 rounded-lg border text-left transition-colors ${
                      reportType === opt.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Fechas</label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Gráfico
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados del reporte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportOptions.find(r => r.id === reportType)?.name} – Resultados
          </h3>
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
        {currentData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay datos disponibles para este reporte.
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesPage;