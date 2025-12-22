import React, { useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw, Search, Filter } from 'lucide-react';
import api, { alquilerServiceExtended } from '../../../../services/api';

// Obtiene un nombre legible del cliente a partir de distintas posibles estructuras
const getClienteNombre = (r) => {
  if (r?.nombreCliente) return r.nombreCliente;
  if (r?.idTurista && nombreCache[r.idTurista]) return nombreCache[r.idTurista];
  const t = r?.turista || r?.cliente || {};
  const nombres = t.nombres || t.nombre || '';
  const apellidos = t.apellidos || t.apellido || '';
  const full = `${nombres} ${apellidos}`.trim();
  if (full) return full;
  // fallback por si solo tenemos id o documento
  return t.dniPasaporte || r?.idTurista || '';
};

const exportToCSV = (rows) => {
  if (!rows || rows.length === 0) return;
  const headers = ['ID ALQUILER','CLIENTE','RECURSO(S)','FECHA','MONTO','ESTADO'];
  const csvRows = [headers.join(',')];
  rows.forEach(r => {
    const recursos = (r.detalles || []).map(d => d.nombreRecurso || d.idRecurso).join(' | ');
    const cliente = getClienteNombre(r) || '';
    const fecha = r.fechaHoraInicio ? new Date(r.fechaHoraInicio).toLocaleString('es-PE') : '';
    const monto = typeof r.costoTotal === 'number' ? r.costoTotal.toFixed(2) : r.costoTotal;
    csvRows.push([
      r.idAlquiler,
      '"' + cliente + '"',
      '"' + recursos + '"',
      (r.detalles || []).length,
      '"' + fecha + '"',
      monto,
      r.estadoalquiler
    ].join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `alquileres_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ListaAlquileresRecientes = ({ actualizarLista = 0, onVerDetalle }) => {
  const [alquileres, setAlquileres] = useState([]);
  const [nombreCache, setNombreCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(''); // placeholder visual

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      // Consumimos el endpoint enriquecido con nombreCliente
      const { data } = await api.get('/alquileres/enriquecidos');
      setAlquileres(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar la lista de alquileres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Fallback: resolver nombre del cliente por idTurista si no vino en la lista
  useEffect(() => {
    const resolver = async () => {
      const pendientes = (alquileres || []).filter(r => !r.nombreCliente && r.idTurista && !nombreCache[r.idTurista]);
      if (pendientes.length === 0) return;
      const nuevos = {};
      for (const r of pendientes) {
        try {
          const { data } = await api.get(`/turistas/${r.idTurista}`);
          if (data && (data.nombres || data.apellidos)) {
            nuevos[r.idTurista] = `${data.nombres || ''} ${data.apellidos || ''}`.trim();
          }
        } catch (err) {
          // Ignorar
        }
      }
      if (Object.keys(nuevos).length > 0) {
        setNombreCache(prev => ({ ...prev, ...nuevos }));
      }
    };
    resolver();
  }, [alquileres, nombreCache]);

  useEffect(() => {
    if (actualizarLista > 0) cargar();
  }, [actualizarLista]);

  const rowsFiltradas = useMemo(() => {
    let base = alquileres;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      base = base.filter(r => {
        const clienteTexto = getClienteNombre(r).toLowerCase();
        const recursos = (r.detalles || []).map(d => (d.nombreRecurso || d.idRecurso || '')).join(' ').toLowerCase();
        return (
          String(r.idAlquiler || '').toLowerCase().includes(q) ||
          clienteTexto.includes(q) ||
          recursos.includes(q) ||
          String(r.estadoalquiler || '').toLowerCase().includes(q)
        );
      });
    }
    if (filtroEstado) {
      const fe = filtroEstado.toLowerCase();
      base = base.filter(r => String(r.estadoalquiler || '').toLowerCase().includes(fe));
    }
    // Orden coherente: fecha más reciente primero
    return [...base].sort((a, b) => {
      const da = a.fechaHoraInicio ? new Date(a.fechaHoraInicio).getTime() : 0;
      const db = b.fechaHoraInicio ? new Date(b.fechaHoraInicio).getTime() : 0;
      return db - da;
    });
  }, [alquileres, searchTerm, filtroEstado]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Alquileres Recientes</h3>
        <div className="flex flex-1 md:flex-none items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full md:w-80 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, recurso, estado..."
              className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFiltroEstado(prev => prev ? '' : 'Activo')}
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
            >
              <Filter className="w-4 h-4" /> {filtroEstado ? `Estado: ${filtroEstado}` : 'Filtros'}
            </button>
          </div>
          <button
            onClick={() => exportToCSV(rowsFiltradas)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={cargar}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
          Cargando alquileres...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red-600">{error}</div>
      ) : rowsFiltradas.length === 0 ? (
        <div className="py-6 text-sm text-gray-600">No hay alquileres</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Recurso(s)</th>
                <th className="text-left py-3 px-4 font-medium">Fecha</th>
                <th className="text-left py-3 px-4 font-medium">Monto</th>
                <th className="text-left py-3 px-4 font-medium">Estado</th>
                <th className="text-right py-3 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rowsFiltradas.map((r) => (
                <tr key={r.idAlquiler} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">{r.idAlquiler}</td>
                  <td className="py-3 px-4 text-gray-700">{getClienteNombre(r) || '—'}</td>
                  <td className="py-3 px-4 text-gray-700 max-w-md truncate">
                    {Array.isArray(r.nombresRecursos) && r.nombresRecursos.length > 0
                      ? r.nombresRecursos.join(' | ')
                      : `${(r.detalles || []).length} recurso(s)`}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.fechaHoraInicio ? new Date(r.fechaHoraInicio).toLocaleString('es-PE') : ''}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">S/. {typeof r.costoTotal === 'number' ? r.costoTotal.toFixed(2) : r.costoTotal}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.estadoalquiler === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{r.estadoalquiler || '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const { data } = await api.get(`/boletas/${r.idAlquiler}/html`, { responseType: 'text' });
                            const blob = new Blob([data], { type: 'text/html;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                            setTimeout(() => URL.revokeObjectURL(url), 60_000);
                          } catch (err) {
                            console.error('Error al abrir boleta', err);
                            alert('No se pudo abrir la boleta. ¿Tu sesión sigue activa? (HTTP 401)');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                        title="Ver boleta"
                      >
                        <FileText className="w-4 h-4" />
                        Ver boleta
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const { data } = await api.get(`/boletas/${r.idAlquiler}/pdf`, { responseType: 'blob' });
                            const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `boleta_${r.idAlquiler}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 60_000);
                          } catch (err) {
                            console.error('Error al descargar boleta PDF', err);
                            alert('No se pudo descargar la boleta PDF. ¿Tu sesión sigue activa? (HTTP 401)');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                        title="Descargar boleta PDF"
                      >
                        <FileText className="w-4 h-4" />
                        Descargar PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaAlquileresRecientes;
