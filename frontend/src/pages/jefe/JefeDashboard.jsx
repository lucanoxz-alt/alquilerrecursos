// src/pages/jefe/jefeDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Users, MapPin, FileText } from 'lucide-react';
import api from '../../services/api';

const JefeDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalAlquileres: 0,
    ingresosTotales: 0,
    clientesActivos: 0,
    recursosDisponibles: 0
  });
  const [alquileres, setAlquileres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const verBoleta = async (idAlquiler) => {
    try {
      const { data } = await api.get(`/boletas/${idAlquiler}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank', 'width=800,height=600,scrollbars=yes');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error('Error al abrir boleta PDF desde dashboard', e);
      alert('No se pudo abrir la boleta en PDF.');
    }
  };

  useEffect(() => {
    const cargarDatosReales = async () => {
      setLoading(true);
      try {
        let alquileresData = [];
        let turistasData = [];
        let recursosData = [];
        try {
          const [alq, tur, rec] = await Promise.all([
            api.get('/alquileres/enriquecidos'),
            api.get('/turistas'),
            api.get('/recursos')
          ]);
          alquileresData = alq.data || [];
          turistasData = tur.data || [];
          recursosData = rec.data || [];
        } catch (e) {
          console.warn('Error cargando datos del dashboard', e);
          setErrorMsg('No se pudo cargar datos del dashboard: ' + (e?.message || 'error desconocido'));
        }

        const statsReales = {
          totalAlquileres: alquileresData.length || 0,
          ingresosTotales: alquileresData.reduce((sum, alq) => sum + (alq.costoTotal || 0), 0),
          clientesActivos: turistasData.length || 0,
          recursosDisponibles: recursosData.filter(r => r.estado === 'Disponible').length || 0
        };

        const parseLocalLima = (iso) => {
          if (!iso) return null;
          const s = String(iso).endsWith('Z') ? iso : `${iso}Z`;
          const d = new Date(s);
          return d;
        };

        const alquileresRecientes = alquileresData
          .sort((a, b) => { const aIso = a.fechaHoraInicio && !String(a.fechaHoraInicio).endsWith('Z') ? `${a.fechaHoraInicio}Z` : a.fechaHoraInicio; const bIso = b.fechaHoraInicio && !String(b.fechaHoraInicio).endsWith('Z') ? `${b.fechaHoraInicio}Z` : b.fechaHoraInicio; return new Date(bIso) - new Date(aIso); })
          .slice(0, 5)
          .map(alq => {
            const turista = turistasData.find(t => t.idTurista === alq.idTurista);
            const nombreCliente = turista ? `${turista.nombres} ${turista.apellidos}` : `Cliente ${alq.idTurista}`;
            return {
              id: alq.idAlquiler,
              cliente: nombreCliente,
              recurso: `${alq.detalles?.length || 1} recurso${alq.detalles?.length > 1 ? 's' : ''}`,
              fecha: (() => { const d = parseLocalLima(alq.fechaHoraInicio); return d ? d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }) : ''; })(),
              monto: alq.costoTotal || 0,
              estado: alq.estadoalquiler
            };
          });

        setStats(statsReales);
        setAlquileres(alquileresRecientes);
      } catch (error) {
        setErrorMsg('No se pudo cargar datos del dashboard: ' + (error?.message || 'error desconocido'));
        setStats({ totalAlquileres: 0, ingresosTotales: 0, clientesActivos: 0, recursosDisponibles: 0 });
        setAlquileres([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosReales();
    const interval = setInterval(cargarDatosReales, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const RecentBookingsTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Alquileres Recientes</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver todos</button>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alquileres.map((alquiler) => (
              <tr key={alquiler.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{alquiler.id}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{alquiler.cliente}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{alquiler.recurso}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{alquiler.fecha}</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">S/. {Number(alquiler.monto || 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    alquiler.estado === 'Activo' ? 'bg-blue-100 text-blue-800' :
                    alquiler.estado === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {alquiler.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => verBoleta(alquiler.id)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md" title="Ver boleta del alquiler">
                    <FileText className="w-3 h-3 mr-1" /> Ver Boleta
                  </button>
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
      {errorMsg && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded">{errorMsg}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Alquileres" value={stats.totalAlquileres} change="+12%" icon={Package} color="blue" />
        <StatCard title="Ingresos Totales" value={`S/. ${stats.ingresosTotales}`} change="+8.5%" icon={DollarSign} color="green" />
        <StatCard title="Clientes Activos" value={stats.clientesActivos} change="+5%" icon={Users} color="purple" />
        <StatCard title="Recursos Disponibles" value={stats.recursosDisponibles} change="-2%" icon={MapPin} color="orange" />
      </div>

      <RecentBookingsTable />
    </div>
  );
};

export default JefeDashboard;