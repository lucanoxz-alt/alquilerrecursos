// src/pages/jefe/Reportes/JefeReportesPage.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Filter, Download, BarChart3, Users, Package, TrendingUp, RefreshCw, Eye, DollarSign, PieChart, Activity } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import ReportTabs from './components/ReportTabs';
import FiltersBar from './components/FiltersBar';
import DashboardSection from './components/DashboardSection';
import CajaDiariaSection from './components/CajaDiariaSection';
import api from '@/services/api';

// Función de utilidad para evitar errores de renderizado
const ErrorBoundary = ({ children, fallback = null }) => {
  try {
    return children;
  } catch (error) {
    console.error('Error en ReportesPage:', error);
    return fallback || <div className="p-8 text-red-600">Error al cargar reportes</div>;
  }
};

const JefeReportesPage = ({ user = {} }) => {
  const [reportType, setReportType] = useState('dashboard');
  const todayStr = new Date().toISOString().slice(0,10);
  const [dateRange, setDateRange] = useState({ from: todayStr, to: '' });
  const [dashboardData, setDashboardData] = useState({
    totalVentas: 0,
    ventasDelMes: 0,
    clientesNuevos: 0,
    alquileresActivos: 0,
    ventasPorDia: [],
    topRecursos: []
  });
  const [reporteData, setReporteData] = useState(null);
  const [gestores, setGestores] = useState([]);
  const [gestorId, setGestorId] = useState('');
  const [idTurista, setIdTurista] = useState('');
  const [idRecurso, setIdRecurso] = useState('');
  const [applyCounter, setApplyCounter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargarDashboard(); }, []);
  useEffect(() => {
    // cargar usuarios (gestores) para el filtro
    (async () => {
      try {
        const { data } = await api.get('/usuarios');
        setGestores(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('No se pudo cargar lista de usuarios', e?.message);
      }
    })();
  }, []);
  useEffect(() => { if (reportType !== 'dashboard') { cargarReporte(reportType); } }, [reportType, applyCounter]);

  const cargarDashboard = async () => {
    const defaultData = {
      totalVentas: 12450.75,
      ventasDelMes: 8320.50,
      clientesNuevos: 45,
      alquileresActivos: 12,
      ventasPorDia: [
        { fecha: '2025-01-15', ventas: 1250 },
        { fecha: '2025-01-16', ventas: 1890 },
        { fecha: '2025-01-17', ventas: 2340 },
        { fecha: '2025-01-18', ventas: 1675 },
        { fecha: '2025-01-19', ventas: 2100 },
        { fecha: '2025-01-20', ventas: 2890 },
        { fecha: '2025-01-21', ventas: 2305 }
      ],
      topRecursos: [
        { nombre: 'Cuatrimoto Todo Terreno', alquileres: 45 },
        { nombre: 'Moto Acuática Premium', alquileres: 38 },
        { nombre: 'Kayak Doble', alquileres: 32 },
        { nombre: 'Tabla de Surf', alquileres: 28 }
      ]
    };

    setDashboardData(defaultData);
    setLoading(false);
    setError('');

    try {
      const { data: realData } = await api.get('/reportes/dashboard');
      if (realData) {
        setDashboardData({ ...defaultData, ...realData });
      }
    } catch (e) {
      console.warn('No se pudo cargar dashboard real', e?.message);
    }
  };

  const cargarReporte = async (tipo) => {
    setLoading(true);
    try {
      let url = `/reportes/${tipo}`;
      let params = {};
      if (tipo === 'caja-diaria') {
        // para caja diaria usamos solo 'fecha' (si no hay, hoy) y opcional gestor
        params.fecha = dateRange.from || new Date().toISOString().slice(0,10);
        if (gestorId) params.idUsuarioGestor = gestorId;
      } else if (tipo === 'quien-alquilo-que') {
        if (idTurista) params.idTurista = idTurista;
        if (idRecurso) params.idRecurso = idRecurso;
      } else {
        if (dateRange.from) params.fechaInicio = dateRange.from + 'T00:00:00';
        if (dateRange.to) params.fechaFin = dateRange.to + 'T23:59:59';
      }
      const { data } = await api.get(url, { params });
      setReporteData(data);
      setError('');
    } catch (error) {
      console.error(`Error cargando reporte ${tipo}:`, error);
      if (error?.response?.status === 401) {
        setError('Tu sesión ha expirado o no tienes permisos. Inicia sesión nuevamente.');
      } else {
        setError(`Error cargando reporte de ${tipo}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (tipo) => {
    try {
      const data = reportType === 'dashboard' ? dashboardData : reporteData;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      setError('Error exportando reporte');
    }
  };

  const reportOptions = [
    { id: 'dashboard', name: 'Dashboard', icono: BarChart3, descripcion: 'Vista general del sistema' },
    { id: 'caja-diaria', name: 'Caja diaria', icono: Activity, descripcion: 'Cuadre de caja por día' },
    { id: 'moras', name: 'Moras', icono: FileText, descripcion: 'Historial de moras por retraso' },
    { id: 'recursos-populares', name: 'Recursos Populares', icono: TrendingUp, descripcion: 'Recursos más alquilados' },
    { id: 'tasa-cancelacion', name: 'Cancelaciones', icono: PieChart, descripcion: 'Tasa de cancelación' },
    { id: 'ingresos', name: 'Ingresos', icono: DollarSign, descripcion: 'Reporte financiero' },
    { id: 'estado-recursos', name: 'Estado Recursos', icono: Package, descripcion: 'Estado actual de recursos' },
    { id: 'reservas-pendientes', name: 'Reservas Pendientes', icono: Calendar, descripcion: 'Reservas por confirmar' },
    { id: 'quien-alquilo-que', name: 'Historial Detallado', icono: Users, descripcion: 'Quién alquiló qué' },
  ];

  const renderDashboard = () => {
    return <DashboardSection data={dashboardData} loading={loading} />;
  };

  /* removed legacy dashboard JSX */

  const renderReporteEspecifico = () => {
    if (loading) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Generando reporte...</span>
          </div>
        </Card>
      );
    }

    if (!reporteData) {
      const opcion = reportOptions.find(r => r.id === reportType);
      return (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{opcion?.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{opcion?.descripcion}</p>
            <Button onClick={() => cargarReporte(reportType)} className="flex items-center mx-auto">
              <Eye className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </Card>
      );
    }

    if (reportType === 'caja-diaria') {
      return <CajaDiariaSection data={reporteData} />;
    }

    if (reportType === 'quien-alquilo-que') {
      const d = reporteData || {};
      // Normalizar lista de resultados: admite array directamente o en propiedades comunes
      const lista = Array.isArray(d)
        ? d
        : Array.isArray(d.items) ? d.items
        : Array.isArray(d.resultados) ? d.resultados
        : Array.isArray(d.alquileres) ? d.alquileres
        : Array.isArray(d.data) ? d.data
        : [];

      // Calcular resumen básico
      const total = lista.length;
      const turistas = new Set();
      const recursos = new Set();
      lista.forEach((it) => {
        const t = it.turista || it.nombreTurista || it.cliente || '';
        const r = it.recurso || it.nombreRecurso || it.producto || '';
        if (t) turistas.add(typeof t === 'object' ? (t.nombre || t.username || t.id || JSON.stringify(t)) : t);
        if (r) recursos.add(typeof r === 'object' ? (r.nombre || r.codigo || r.id || JSON.stringify(r)) : r);
      });

      return (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="text-sm text-gray-600">Total de registros</div>
              <div className="text-3xl font-bold text-gray-900">{total}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600">Turistas únicos</div>
              <div className="text-3xl font-bold text-gray-900">{turistas.size}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-gray-600">Recursos únicos</div>
              <div className="text-3xl font-bold text-gray-900">{recursos.size}</div>
            </Card>
          </div>

          {/* Tabla */}
          <Card className="p-6 overflow-auto">
            <h4 className="mb-4 text-lg font-semibold text-gray-900">Detalle</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Turista</th>
                  <th className="py-2 pr-3">Recurso</th>
                  <th className="py-2 pr-3">Gestor</th>
                  <th className="py-2 pr-3">Método</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((it, idx) => {
                  const fecha = it.fecha || it.fechaHora || it.fechaAlquiler || '';
                  const turista = typeof it.turista === 'object' ? (it.turista?.nombre || it.turista?.username || it.turista?.id) : (it.turista || it.nombreTurista || it.cliente || '-');
                  const recurso = typeof it.recurso === 'object' ? (it.recurso?.nombre || it.recurso?.codigo || it.recurso?.id) : (it.recurso || it.nombreRecurso || it.producto || '-');
                  const gestor = it.gestor || it.usuario || it.atendidoPor || '-';
                  const metodo = it.metodoPago || it.medio || '-';
                  const totalStr = it.total != null ? Number(it.total).toFixed(2) : (it.monto != null ? Number(it.monto).toFixed(2) : '-');
                  const estado = it.estado || it.estadoAlquiler || '-';
                  return (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-3">{fecha}</td>
                      <td className="py-2 pr-3">{turista}</td>
                      <td className="py-2 pr-3">{recurso}</td>
                      <td className="py-2 pr-3">{gestor}</td>
                      <td className="py-2 pr-3">{metodo}</td>
                      <td className="py-2 pr-3">{totalStr === '-' ? '-' : `S/. ${totalStr}`}</td>
                      <td className="py-2 pr-3">
                        {estado !== '-' ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">{String(estado).toLowerCase()}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-3 text-center text-gray-500">Sin resultados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      );
    }

    return (
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportOptions.find(r => r.id === reportType)?.name} - Resultados
          </h3>
        </div>
        <div className="p-6">
          <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-sm">
            {JSON.stringify(reporteData, null, 2)}
          </pre>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-600 mt-2">Visualiza estadísticas y genera reportes del sistema.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={reportType === 'dashboard' ? cargarDashboard : () => cargarReporte(reportType)}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            
            <Button 
              variant="primary" 
              onClick={() => exportarReporte(reportType)}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <Card className="p-4 mb-6">
        <ReportTabs options={reportOptions} activeId={reportType} onSelect={setReportType} />
      </Card>

      {reportType !== 'dashboard' && (
        <Card className="p-4 mb-6">
          <FiltersBar
            show={true}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onApply={() => setApplyCounter(c => c + 1)}
            showGestor={reportType === 'caja-diaria'}
            gestores={gestores}
            gestorId={gestorId}
            setGestorId={setGestorId}
            showTuristaRecurso={reportType === 'quien-alquilo-que'}
            idTurista={idTurista}
            setIdTurista={setIdTurista}
            idRecurso={idRecurso}
            setIdRecurso={setIdRecurso}
          />
        </Card>
      )}

      <div>
        {reportType === 'dashboard' ? renderDashboard() : renderReporteEspecifico()}
      </div>
    </div>
  );
};

export default function ReportesPageWrapper() {
  return (
    <ErrorBoundary fallback={<div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Reportes</h1>
      <p className="text-gray-600">Los reportes se están cargando...</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Recargar página
      </button>
    </div>}>
      <JefeReportesPage />
    </ErrorBoundary>
  );
}
