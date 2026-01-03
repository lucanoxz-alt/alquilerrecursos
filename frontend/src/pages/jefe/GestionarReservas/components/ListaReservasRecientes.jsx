import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { reservaService } from '@/services/api';
import { 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const ListaReservasRecientes = ({ actualizarLista, onEditarReserva, onVerDetalle }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);
  const [mostrarIdTurista, setMostrarIdTurista] = useState(false);
  const [nombreCache, setNombreCache] = useState({});

  useEffect(() => {
    cargarReservas();
  }, [actualizarLista]);

  const cargarReservas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reservaService.obtenerTodas();
      setReservas(data || []);
      // Enriquecer nombres si no vienen
      try {
        const api = (await import('../../../../services/api'));
        const { data: turistas } = await api.default.get('/turistas');
        const mapa = {};
        (turistas || []).forEach(t => {
          const nombre = `${t.nombres || ''} ${t.apellidos || ''}`.trim();
          if (nombre) mapa[t.idTurista] = nombre;
        });
        setNombreCache(mapa);
      } catch (e) {
        console.warn('No se pudo enriquecer nombres de turistas', e);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setError('Error cargando reservas');
    } finally {
      setLoading(false);
    }
  };

  const confirmarReserva = async (idReserva) => {
    try {
      const resp = await reservaService.confirmar(idReserva);
      // Si el backend devolvió el pago del alquiler, descargar comprobante PDF del pago del 100%
      if (resp && resp.pago && resp.pago.idPago) {
        try {
          const api = (await import('../../../../services/api')).default;
          const { data } = await api.get(`/comprobantes-pago/pago/${resp.pago.idPago}/pdf`, { responseType: 'blob' });
          const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
          const a = document.createElement('a');
          a.href = url;
          a.download = `comprobante_alquiler_${resp.alquiler.idAlquiler}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (e) {
          console.warn('Reserva confirmada, pero no se pudo descargar automáticamente el comprobante del alquiler:', e);
        }
      }

      await cargarReservas(); // Recargar lista
    } catch (error) {
      console.error('Error confirmando reserva:', error);
      setError(error.response?.data?.error || 'Error confirmando reserva');
    }
  };

  const cancelarReserva = async (idReserva, motivo) => {
    try {
      const { getCurrentUserId } = await import('../../../../services/api');
      await reservaService.cancelar(idReserva, motivo, getCurrentUserId());
      await cargarReservas(); // Recargar lista
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      setError('Error cancelando reserva');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Confirmada': return 'bg-green-100 text-green-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Confirmada': return <CheckCircle className="w-4 h-4" />;
      case 'Pendiente': return <AlertCircle className="w-4 h-4" />;
      case 'Cancelada': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const [openMenuId, setOpenMenuId] = useState(null);

  const reservasFiltradas = reservas.filter(reserva => {
    const passEstado = filtroEstado === 'todas' ? true : (reserva.estadoreserva === filtroEstado);
    if (!passEstado) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    const nombreCacheado = (nombreCache && reserva.idTurista && nombreCache[reserva.idTurista]) ? String(nombreCache[reserva.idTurista]) : '';
    const nombre = (reserva.nombreTurista || nombreCacheado).toLowerCase();
    const idTur = String(reserva.idTurista || '').toLowerCase();
    const estado = String(reserva.estadoreserva || '').toLowerCase();
    const idReserva = String(reserva.idReserva || '').toLowerCase();
    return (
      nombre.includes(q) ||
      idTur.includes(q) ||
      estado.includes(q) ||
      idReserva.includes(q)
    );
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando reservas...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Reservas Recientes
          </h3>
          
          <div className="flex items-center space-x-3">
            {/* Buscar general */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-64 shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar general..."
                className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros: desplegable */}
            <div className="relative">
              <button
                onClick={() => setFiltrosAbierto(v => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
              >
                <Filter className="w-4 h-4" /> Filtros
              </button>
              {filtrosAbierto && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2">
                  <div className="text-sm text-gray-700">
                    <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="accent-blue-600" checked={mostrarIdTurista} onChange={(e)=> setMostrarIdTurista(e.target.checked)} />
                      Mostrar ID Turista (en lugar de nombre)
                    </label>
                    <div className="px-2 py-1 mt-2">
                      <span className="text-xs text-gray-500">Estado:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <button onClick={()=> setFiltroEstado('todas')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado==='todas'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Todas</button>
                        <button onClick={()=> setFiltroEstado('Pendiente')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado==='Pendiente'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Pendiente</button>
                        <button onClick={()=> setFiltroEstado('Confirmada')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado==='Confirmada'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Confirmada</button>
                        <button onClick={()=> setFiltroEstado('Cancelada')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado==='Cancelada'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Cancelada</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exportar CSV para Excel */}
            <button
              onClick={async () => {
                try {
                  const filas = reservasFiltradas;
                  if (!filas || filas.length === 0) return alert('No hay datos para exportar');
                  const sep = ';';
                  const headers = ['ID RESERVA','TURISTA','FECHA PREVISTA','ESTADO','COSTO ESTIMADO'];
                  const rows = [headers.join(sep)];
                  const esc = (v) => String(v ?? '').replace(/"/g, '""');
                  filas.forEach(r => {
                    const fecha = (() => {
                      const s = r.fechaHoraInicioPrevista;
                      const m = String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
                      if (!m) return '';
                      const [_, y, mo, d, h, mi, se] = m;
                      const ms = Date.UTC(parseInt(y), parseInt(mo)-1, parseInt(d), parseInt(h), parseInt(mi), parseInt(se||'0')) + (5*60*60*1000);
                      const date = new Date(ms);
                      return date.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' });
                    })();
                    const turista = mostrarIdTurista ? (r.idTurista) : (r.nombreTurista || nombreCache[r.idTurista] || r.idTurista);
                    rows.push([
                      esc(r.idReserva),
                      '"' + esc(turista) + '"',
                      '"' + esc(fecha) + '"',
                      esc(typeof r.costoTotalEstimado === 'number' ? r.costoTotalEstimado.toFixed(2) : (r.costoTotalEstimado || '')),
                      esc(r.estadoreserva)
                    ].join(sep));
                  });
                  const BOM = '\uFEFF';
                  const blob = new Blob([BOM + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `reservas_${Date.now()}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (e) {
                  console.error('Error exportando CSV', e);
                  alert('No se pudo exportar CSV');
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
            >
              Exportar
            </button>

            {/* Actualizar */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cargarReservas}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Reserva
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turista
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Prevista
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo Estimado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservasFiltradas.map((reserva) => (
              <tr key={reserva.idReserva} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {reserva.idReserva}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="text-sm text-gray-900">{mostrarIdTurista ? (reserva.idTurista) : ((reserva.nombreTurista || nombreCache[reserva.idTurista]) || reserva.idTurista)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(() => { const s = reserva.fechaHoraInicioPrevista; const m = String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/); if (!m) return ''; const [_, y, mo, d, h, mi, se] = m; const ms = Date.UTC(parseInt(y), parseInt(mo)-1, parseInt(d), parseInt(h), parseInt(mi), parseInt(se||'0')) + (5*60*60*1000); const date = new Date(ms); return date.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }); })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getEstadoColor(reserva.estadoreserva)}`}>
                    {getEstadoIcon(reserva.estadoreserva)}
                    <span className="ml-1">{reserva.estadoreserva}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  S/. {reserva.costoTotalEstimado?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Botón "Ver más" con menú */}
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === reserva.idReserva ? null : reserva.idReserva)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                        title="Ver más"
                      >
                        Ver más
                      </button>
                      {openMenuId === reserva.idReserva && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                          <div className="py-1">
                            {reserva.estadoreserva === 'Pendiente' && (
                              <button
                                onClick={() => { setOpenMenuId(null); confirmarReserva(reserva.idReserva); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Confirmar Reserva
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                const motivo = prompt('Motivo de cancelación:');
                                if (motivo) cancelarReserva(reserva.idReserva, motivo);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Cancelar Reserva
                            </button>
                            <hr />
                            <button
                              onClick={async () => {
                                try {
                                  setOpenMenuId(null);
                                  const api = (await import('../../../../services/api')).default;
                                  const { data } = await api.get(`/comprobantes-pago-reserva/reserva/${reserva.idReserva}/pdf`, { responseType: 'blob' });
                                  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                                  const a = document.createElement('a'); a.href = url; a.download = `boleta_reserva_${reserva.idReserva}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                                } catch (err) { console.error('Error al descargar Boleta PDF de reserva', err); alert('No se pudo descargar la Boleta PDF.'); }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Boleta PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reservasFiltradas.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No hay reservas
          </h4>
          <p className="text-sm">
            {filtroEstado === 'todas' 
              ? 'No se han encontrado reservas'
              : `No hay reservas en estado "${filtroEstado}"`
            }
          </p>
        </div>
      )}
    </Card>
  );
};

export default ListaReservasRecientes;