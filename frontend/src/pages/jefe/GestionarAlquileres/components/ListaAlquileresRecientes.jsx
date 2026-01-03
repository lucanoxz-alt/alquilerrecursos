import React, { useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw, Search, Filter, User } from 'lucide-react';
import api, { alquilerServiceExtended } from '../../../../services/api';

// Helper functions moved inside component to access nombreCache


const ListaAlquileresRecientes = ({ actualizarLista = 0, onVerDetalle }) => {
  const [alquileres, setAlquileres] = useState([]);
  const [nombreCache, setNombreCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);
  const [mostrarIdTurista, setMostrarIdTurista] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [modalDetalles, setModalDetalles] = useState({ abierto: false, idAlquiler: null, detalles: [] });
  const [modalFinalizar, setModalFinalizar] = useState({ abierto: false, idAlquiler: null, idDetalle: null, fecha: '', estadoFinal: 'Disponible', esUltimo:false, metodoPago:'Efectivo' });
  const [modalMora, setModalMora] = useState({ abierto:false, idAlquiler:null, boleta:null, moraTotal:0, detalles:[] });

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

  const exportToExcelCSV = (rows, filename = `alquileres_${Date.now()}.csv`) => {
    if (!rows || rows.length === 0) return;
    // Excel en algunos entornos espera ; como separador. Usaremos ; y agregaremos BOM.
    const sep = ';';
    const headers = ['ID ALQUILER','CLIENTE','CANT RECURSOS','RECURSOS','FECHA','MONTO','ESTADO'];
    const csvRows = [headers.join(sep)];
    rows.forEach(r => {
      const nombresRec = Array.isArray(r.nombresRecursos) ? r.nombresRecursos : (r.detalles || []).map(d => d.nombreRecurso || d.idRecurso);
      const recursos = nombresRec.join(' | ');
      const cantRec = (Array.isArray(r.nombresRecursos) ? r.nombresRecursos.length : (r.detalles || []).length) || 0;
      const cliente = mostrarIdTurista ? (r.idTurista || '') : (getClienteNombre(r) || '');
      // formato fecha coherente Lima
      const d = parseLocalLima(r.fechaHoraInicio);
      const fecha = d ? d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }) : '';
      const monto = typeof r.costoTotal === 'number' ? r.costoTotal.toFixed(2) : (r.costoTotal || '');
      // Escapar comillas dobles duplicándolas
      const esc = (v) => String(v ?? '').replace(/"/g, '""');
      csvRows.push([
        esc(r.idAlquiler),
        '"' + esc(cliente) + '"',
        esc(cantRec),
        '"' + esc(recursos) + '"',
        '"' + esc(fecha) + '"',
        esc(monto),
        esc(r.estadoalquiler)
      ].join(sep));
    });
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseLocalLima = (s) => {
  if (!s) return null;
  // Espera formato 'YYYY-MM-DDTHH:mm:ss' (LocalDateTime del backend)
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(s);
  const [_, y, mo, d, h, mi, se] = m;
  const ms = Date.UTC(parseInt(y), parseInt(mo)-1, parseInt(d), parseInt(h), parseInt(mi), parseInt(se||'0')) + (5*60*60*1000); // UTC+5 para mostrar Lima
  return new Date(ms);
};

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
      const da = a.fechaHoraInicio ? parseLocalLima(a.fechaHoraInicio)?.getTime() || 0 : 0;
      const db = b.fechaHoraInicio ? parseLocalLima(b.fechaHoraInicio)?.getTime() || 0 : 0;
      return db - da;
    });
  }, [alquileres, searchTerm, filtroEstado]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Alquileres Recientes</h3>
        <div className="flex flex-1 md:flex-none items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full md:w-64 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar general..."
              className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFiltrosAbierto(v => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
            >
              <Filter className="w-4 h-4" /> Filtros
            </button>
            {filtrosAbierto && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                <div className="p-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" checked={mostrarIdTurista} onChange={(e)=> setMostrarIdTurista(e.target.checked)} />
                    Mostrar ID Turista en columna Cliente
                  </label>
                  <div className="px-2 py-1 mt-2">
                    <span className="text-xs text-gray-500">Filtro rápido de estado:</span>
                    <div className="flex gap-2 mt-1">
                      <button onClick={()=> setFiltroEstado('')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado===''?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Todos</button>
                      <button onClick={()=> setFiltroEstado('Activo')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado==='Activo'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Activo</button>
                      <button onClick={()=> setFiltroEstado('Finalizado')} className={`px-2 py-0.5 rounded border text-xs ${filtroEstado==='Finalizado'?'bg-blue-50 border-blue-200 text-blue-700':'border-gray-200'}`}>Finalizado</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => exportToExcelCSV(rowsFiltradas)}
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
                  <td className="py-3 px-4 text-gray-700">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{mostrarIdTurista ? (r.idTurista || '—') : (getClienteNombre(r) || '—')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 max-w-md truncate">
                    {(() => {
                      const nombresCount = Array.isArray(r.nombresRecursos) ? r.nombresRecursos.length : 0;
                      const detallesCount = Array.isArray(r.detalles) ? r.detalles.length : 0;
                      const count = nombresCount || detallesCount || 1;
                      return count;
                    })()}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{(() => { const d = parseLocalLima(r.fechaHoraInicio); return d ? d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }) : ''; })()}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">S/. {typeof r.costoTotal === 'number' ? r.costoTotal.toFixed(2) : r.costoTotal}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.estadoalquiler === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{r.estadoalquiler || '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const id = r.idAlquiler;
                          try {
                            const { data } = await api.get(`/alquileres/${id}/ticket`, { responseType: 'blob' });
                          const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 60_000);
                          } catch (err) {
                            console.warn('Error al abrir boleta (PDF)', err);
                            const status = err?.response?.status;
                            if (status === 401) {
                              alert('No se pudo descargar la boleta. Inténtalo nuevamente o verifique permisos.');
                              window.location.href = '/login';
                              return;
                            }
                            // Try comprobante-pago as last resort
                            try {
                              const { data } = await api.get(`/comprobantes-pago/alquiler/${id}/pdf`, { responseType: 'blob', headers: { Accept: 'application/pdf' } });
                              const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 60_000);
                              return;
                            } catch (err3) {
                              console.error('Todos los intentos fallaron', err, err3);
                              if (err3?.response?.status === 401) {
                                alert('Tu sesión expiró. Por favor inicia sesión.');
                                window.location.href = '/login';
                                return;
                              }
                            }

                            alert('No se pudo abrir la boleta. Ver consola para más detalles.');
                          }
                        }}
                        className="flex flex-col items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                        title="Ver boleta"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Ver ticket</span>
                      </button>

                      {/* Ver más */}
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === r.idAlquiler ? null : r.idAlquiler)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                          title="Ver más"
                        >
                          Ver más
                        </button>
                        {openMenuId === r.idAlquiler && (
                          <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              <button
                                onClick={async () => {
                                  try {
                                    setOpenMenuId(null);
                                    const { data } = await api.get(`/boletas/${r.idAlquiler}/pdf`, { responseType: 'blob' });
                                    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                                    const a = document.createElement('a'); a.href = url; a.download = `BOLETA_${r.idAlquiler}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 60_000);
                                  } catch (err) {
                                    console.error('Error descargando Boleta', err);
                                    if (err.response && err.response.status === 401) { alert('No se pudo descargar la Boleta. Inténtalo nuevamente.'); return; }
                                    alert('No se pudo descargar la Boleta. Ver consola.');
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Boleta PDF
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    setOpenMenuId(null);
                                    const detalles = await alquilerServiceExtended.listarDetalles(r.idAlquiler);
                                    setModalDetalles({ abierto: true, idAlquiler: r.idAlquiler, detalles });
                                  } catch (e) {
                                    alert('No se pudieron cargar los detalles');
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Ver detalles
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
      )}
      {/* Modal Detalles */}
     {modalDetalles.abierto && (
       <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
         <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
           <div className="flex justify-between items-center mb-4">
             <h4 className="text-lg font-semibold">Recursos del alquiler {modalDetalles.idAlquiler}</h4>
             <button onClick={() => setModalDetalles({ abierto: false, idAlquiler: null, detalles: [] })} className="text-gray-500 hover:text-gray-700">✕</button>
           </div>
           <div className="space-y-3 max-h-[60vh] overflow-y-auto">
             {modalDetalles.detalles.map((d) => (
               <div key={d.idDetalle} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                 <div>
                   <div className="font-medium text-gray-900">{d.nombreRecurso}</div>
                   <div className="text-xs text-gray-600">Teórica devolución: {((s)=>{ if(!s) return '-'; const p=s.replace('T',' ').split('.')[0]; const [dte,time]=p.split(' '); const [y,m,da]=dte.split('-'); return `${da}/${m}/${y} ${time}`; })(d.horaTeoricaDevolucion)}</div>
                   {d.fechaDevolucionReal && (
                     <div className="text-xs text-gray-600">Devuelto: {new Date(d.fechaDevolucionReal).toLocaleString('es-PE')} {d.moraAplicada > 0 ? `(Mora S/. ${Number(d.moraAplicada).toFixed(2)})` : ''}</div>
                   )}
                   <div className="text-xs mt-1"><span className={`px-2 py-0.5 rounded-full ${((d.estadoLogicoRecurso||d.estadoRecurso) === 'Alquilado') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{(d.estadoLogicoRecurso||d.estadoRecurso) || '-'}</span></div>
                 </div>
                 {(!d.fechaDevolucionReal && (d.estadoLogicoRecurso || d.estadoRecurso) === 'Alquilado') && (
                   <button onClick={() => {
                     const now = new Date();
                     const iso = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);
                     const pendientes = (modalDetalles.detalles || []).filter(x => !x.fechaDevolucionReal && (x.estadoLogicoRecurso || x.estadoRecurso) === 'Alquilado');
                     const esUltimo = pendientes.length === 1;
                     setModalFinalizar({ abierto: true, idAlquiler: modalDetalles.idAlquiler, idDetalle: d.idDetalle, fecha: iso, estadoFinal: 'Disponible', esUltimo, metodoPago: 'Efectivo' });
                   }} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Finalizar</button>
                 )}
               </div>
             ))}
           </div>
         </div>
       </div>
     )}

     {/* Modal Finalizar */}
     {modalFinalizar.abierto && (
       <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
         <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
           <div className="flex justify-between items-center mb-4">
             <h4 className="text-lg font-semibold">Confirmar devolución</h4>
             <button onClick={() => setModalFinalizar({ abierto: false, idAlquiler: null, idDetalle: null, fecha: '', estadoFinal: 'Disponible' })} className="text-gray-500 hover:text-gray-700">✕</button>
           </div>
           <div className="space-y-4">
             <div>
               <label className="block text-sm text-gray-700 mb-1">Fecha y hora real de devolución</label>
               <input type="datetime-local" value={modalFinalizar.fecha} readOnly disabled className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600" />
             </div>
             <div>
               <label className="block text-sm text-gray-700 mb-1">Estado final del recurso</label>
               <select value={modalFinalizar.estadoFinal} onChange={(e)=> setModalFinalizar(v => ({ ...v, estadoFinal: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                 <option>Disponible</option>
                 <option>Mantenimiento</option>
                 <option>Fuera de Servicio</option>
               </select>
             </div>
             <div className="flex justify-between items-center gap-3">
               
               <div className="flex justify-end gap-2">
                 <button onClick={() => setModalFinalizar({ abierto: false, idAlquiler: null, idDetalle: null, fecha: '', estadoFinal: 'Disponible', esUltimo:false, metodoPago:'Efectivo' })} className="px-4 py-2 rounded-lg border">Cancelar</button>
                 <button onClick={async () => {
                   try {
                     const payload = { idDetalle: modalFinalizar.idDetalle, fechaDevolucionReal: modalFinalizar.fecha, estadoFinal: modalFinalizar.estadoFinal, metodoPago: modalFinalizar.esUltimo ? modalFinalizar.metodoPago : undefined };
                     const resp = await alquilerServiceExtended.finalizarRecurso(modalFinalizar.idAlquiler, payload);
                     if (resp.moraTotal && resp.detallesMora && resp.detallesMora.length > 0) {
                       setModalMora({ abierto:true, idAlquiler: modalFinalizar.idAlquiler, boleta: null, moraTotal: resp.moraTotal, detalles: resp.detallesMora, metodoPago: 'Efectivo' });
                     }
                     setModalFinalizar({ abierto: false, idAlquiler: null, idDetalle: null, fecha: '', estadoFinal: 'Disponible', esUltimo:false, metodoPago:'Efectivo' });
                     // Refrescar detalles y lista
                     const detalles = await alquilerServiceExtended.listarDetalles(modalDetalles.idAlquiler);
                     setModalDetalles(prev => ({ ...prev, detalles }));
                     cargar();
                   } catch (e) {
                     alert(e?.response?.data?.error || 'Error al finalizar el recurso');
                   }
                 }} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Confirmar devolución</button>
               </div>
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
  );
};

      {/* Modal Pago de Mora */}
      {modalMora.abierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Pago de mora</h4>
              <button onClick={() => setModalMora({ abierto:false, idAlquiler:null, boleta:null, moraTotal:0, detalles:[] })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Recurso</th>
                    <th className="p-2 text-right">Minutos</th>
                    <th className="p-2 text-right">Mora (S/.)</th>
                  </tr>
                </thead>
                <tbody>
                  {modalMora.detalles.map((d,i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{d.nombreRecurso}</td>
                      <td className="p-2 text-right">{d.minutosExtra}</td>
                      <td className="p-2 text-right">{Number(d.moraAplicada||0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <div className="text-gray-700 font-medium">Total a pagar:</div>
                <div className="text-gray-900 font-bold">S/. {Number(modalMora.moraTotal||0).toFixed(2)}</div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-gray-700 mb-1">Método de pago</label>
                <select value={modalMora.metodoPago||'Efectivo'} onChange={(e)=> setModalMora(v=>({...v, metodoPago: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                  <option>Yape</option>
                  <option>Transferencia</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModalMora({ abierto:false, idAlquiler:null, boleta:null, moraTotal:0, detalles:[] })} className="px-4 py-2 rounded-lg border">Cancelar</button>
                <button onClick={async ()=>{
                  try {
                    const { data } = await api.post(`/alquileres/${modalMora.idAlquiler}/registrar-mora`, { metodoPago: modalMora.metodoPago||'Efectivo' });
                    alert(`Pago de mora registrado. Comprobante: ${data.boletaMora}`);
                    // Abrir PDF del comprobante
                    try {
                      const pdf = await api.get(`/comprobantes-pago/alquiler/${modalMora.idAlquiler}/pdf`, { responseType: 'blob' });
                      const url = URL.createObjectURL(new Blob([pdf.data], { type: 'application/pdf' }));
                      window.open(url, '_blank');
                      setTimeout(()=>URL.revokeObjectURL(url), 60_000);
                    } catch {}
                    setModalMora({ abierto:false, idAlquiler:null, boleta:null, moraTotal:0, detalles:[] });
                    cargar();
                  } catch (e) {
                    alert(e?.response?.data?.error || 'No se pudo registrar el pago de mora');
                  }
                }} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Registrar pago de mora</button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
  );
};

export default ListaAlquileresRecientes;
