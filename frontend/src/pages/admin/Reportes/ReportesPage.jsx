// src/pages/admin/ReportesPage.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Filter, Download, BarChart3, Users, Package, TrendingUp, RefreshCw, Eye, DollarSign, PieChart } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const ReportesPage = ({ user }) => {
  const [reportType, setReportType] = useState('dashboard');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [dashboardData, setDashboardData] = useState(null);
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  useEffect(() => {
    if (reportType !== 'dashboard') {
      cargarReporte(reportType);
    }
  }, [reportType, dateRange]);

  const cargarDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reportes/dashboard');
      const data = await response.json();
      setDashboardData(data);
      setError('');
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setError('Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  };

  const cargarReporte = async (tipo) => {
    setLoading(true);
    try {
      let url = `/api/reportes/${tipo}`;
      const params = new URLSearchParams();
      
      if (dateRange.from) params.append('fechaInicio', dateRange.from + 'T00:00:00');
      if (dateRange.to) params.append('fechaFin', dateRange.to + 'T23:59:59');
      
      if (params.toString()) url += `?${params}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setReporteData(data);
      setError('');
    } catch (error) {
      console.error(`Error cargando reporte ${tipo}:`, error);
      setError(`Error cargando reporte de ${tipo}`);
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

  // Tipos de reporte disponibles
  const reportOptions = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, descripcion: 'Vista general del sistema' },
    { id: 'recursos-populares', name: 'Recursos Populares', icon: TrendingUp, descripcion: 'Recursos más alquilados' },
    { id: 'tasa-cancelacion', name: 'Cancelaciones', icon: PieChart, descripcion: 'Tasa de cancelación' },
    { id: 'ingresos', name: 'Ingresos', icon: DollarSign, descripcion: 'Reporte financiero' },
    { id: 'estado-recursos', name: 'Estado Recursos', icon: Package, descripcion: 'Estado actual de recursos' },
    { id: 'reservas-pendientes', name: 'Reservas Pendientes', icon: Calendar, descripcion: 'Reservas por confirmar' },
    { id: 'quien-alquilo-que', name: 'Historial Detallado', icon: Users, descripcion: 'Quién alquiló qué' },
  ];

  const renderDashboard = () => {
    if (loading || !dashboardData) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Cargando dashboard...</span>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Reservas</h3>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {dashboardData.totalReservas}
            </div>
            <p className="text-sm text-gray-600">Todas las reservas</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Alquileres</h3>
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {dashboardData.totalAlquileres}
            </div>
            <p className="text-sm text-gray-600">Alquileres completados</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ingresos del Mes</h3>
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              S/. {dashboardData.ingresosMesActual?.toFixed(2) || '0.00'}
            </div>
            <p className="text-sm text-gray-600">Mes actual</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recursos Disponibles</h3>
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {dashboardData.recursosDisponibles}
            </div>
            <p className="text-sm text-gray-600">De {dashboardData.totalRecursos} totales</p>
          </Card>
        </div>

        {/* Estado de reservas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Reservas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(dashboardData.reservasPorEstado || {}).map(([estado, cantidad]) => (
              <div key={estado} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{cantidad}</div>
                <div className="text-sm text-gray-600 capitalize">{estado}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumen operativo */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Operativo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-green-800">Alquileres Activos</div>
                  <div className="text-2xl font-bold text-green-900">{dashboardData.alquileresActivos}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-blue-800">Turistas Registrados</div>
                  <div className="text-2xl font-bold text-blue-900">{dashboardData.totalTuristas}</div>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

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

    return (
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportOptions.find(r => r.id === reportType)?.name} - Resultados
          </h3>
        </div>
        <div className="p-6">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
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

      {/* Navegación de reportes */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {reportOptions.map((reporte) => {
            const IconComponent = reporte.icono;
            return (
              <button
                key={reporte.id}
                onClick={() => setReportType(reporte.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reportType === reporte.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {reporte.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Filtros de fecha para reportes específicos */}
      {reportType !== 'dashboard' && (
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => cargarReporte(reportType)} 
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Contenido del reporte */}
      <div>
        {reportType === 'dashboard' ? renderDashboard() : renderReporteEspecifico()}
      </div>
    </div>
  );
};

export default ReportesPage;