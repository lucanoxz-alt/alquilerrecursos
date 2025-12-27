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
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

const ListaReservasRecientes = ({ actualizarLista, onEditarReserva, onVerDetalle }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  useEffect(() => {
    cargarReservas();
  }, [actualizarLista]);

  const cargarReservas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reservaService.obtenerTodas();
      setReservas(data || []);
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
    if (filtroEstado === 'todas') return true;
    return reserva.estadoreserva === filtroEstado;
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
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="todas">Todas</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Confirmada">Confirmadas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
            
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
                    <div className="text-sm text-gray-900">
                      {reserva.idTurista}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(reserva.fechaHoraInicioPrevista).toLocaleString()}
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
                    {/* Botón principal: Ticket (Comprobante de Pago Inicial) */}
                    <button
                      onClick={async () => {
                        try {
                          const api = (await import('../../../../services/api')).default;
                          const { data } = await api.get(`/comprobantes-pago-reserva/reserva/${reserva.idReserva}/pdf`, { responseType: 'blob' });
                          const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 60_000);
                        } catch (err) {
                          console.error('Error al abrir tiket de reserva', err);
                          alert('No se pudo abrir el tiket de reserva. ¿Tu sesión sigue activa?');
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                      title="Ticket (Comprobante de Pago Inicial)"
                    >
                      Ticket
                    </button>

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
                            <button
                              onClick={async () => {
                                try {
                                  setOpenMenuId(null);
                                  const api = (await import('../../../../services/api')).default;
                                  const { data } = await api.get(`/comprobantes-pago-reserva/reserva/${reserva.idReserva}/pdf`, { responseType: 'blob' });
                                  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                                  const a = document.createElement('a'); a.href = url; a.download = `factura_reserva_${reserva.idReserva}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                                } catch (err) { console.error('Error al descargar Factura PDF de reserva', err); alert('No se pudo descargar la Factura PDF.'); }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Factura PDF
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  setOpenMenuId(null);
                                  const api = (await import('../../../../services/api')).default;
                                  // XML de comprobante de reserva no disponible vía este endpoint
                                  alert('XML no disponible para comprobantes de reserva vía este botón.');
                                } catch (err) { console.error('Error al descargar XML de reserva', err); alert('No se pudo descargar el XML.'); }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              XML
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onVerDetalle && onVerDetalle(reserva)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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