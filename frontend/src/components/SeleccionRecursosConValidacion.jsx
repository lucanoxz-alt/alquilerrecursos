import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button } from '@/components/ui';
import { disponibilidadService } from '@/services/api';

const SeleccionRecursosConValidacion = ({ onRecursosSeleccionados, fechaInicio, duracionHoras }) => {
  const [recursos, setRecursos] = useState([]); // [{ recurso, estadoDisponibilidad, horaDisponible }]
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipos, setTipos] = useState([]);
  const [tipoNombreMap, setTipoNombreMap] = useState({});
  const [frecuentes, setFrecuentes] = useState({});
  const [recursosSeleccionados, setRecursosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [validacionGlobal, setValidacionGlobal] = useState({ valida: false, mensaje: '' });

  useEffect(() => {
    if (fechaInicio) cargarRecursosConDisponibilidad();
  }, [fechaInicio, duracionHoras]);

  useEffect(() => {
    if (recursosSeleccionados.length > 0 && fechaInicio && duracionHoras) {
      validarSeleccionCompleta();
    }
  }, [recursosSeleccionados, fechaInicio, duracionHoras]);

  const cargarRecursosConDisponibilidad = async () => {
    setCargando(true);
    try {
      // cargar tipos para mostrar nombres legibles en filtros y chips
      try {
        const resp = await fetch('/api/tipos-recursos');
        const tiposData = await resp.json();
        const lista = Array.isArray(tiposData) ? tiposData : [];
        setTipos(lista);
        const map = {};
        lista.forEach(t => { if (t.idTipo) map[t.idTipo] = t.nombre; });
        setTipoNombreMap(map);
      } catch {}

      const data = await disponibilidadService.obtenerRecursosDetalle(fechaInicio, duracionHoras || 1);
      setRecursos(data.detalle || []);
    } catch (error) {
      console.error('Error cargando recursos:', error);
      setRecursos([]);
    } finally {
      setCargando(false);
    }
  };

  const validarSeleccionCompleta = async () => {
    if (recursosSeleccionados.length === 0) {
      setValidacionGlobal({ valida: false, mensaje: 'No hay recursos seleccionados' });
      return;
    }
    try {
      const idsSeleccionados = recursosSeleccionados.map(r => r.idRecurso);
      const resultado = await disponibilidadService.verificarMultiple(idsSeleccionados, fechaInicio, duracionHoras);
      setValidacionGlobal({
        valida: resultado.todosDisponibles,
        mensaje: resultado.todosDisponibles ? 'Todos los recursos están disponibles' : 'Algunos recursos no están disponibles'
      });
      onRecursosSeleccionados && onRecursosSeleccionados({
        recursos: recursosSeleccionados,
        valida: resultado.todosDisponibles,
        detalles: resultado
      });
    } catch (error) {
      console.error('Error validando selección:', error);
      setValidacionGlobal({ valida: false, mensaje: 'Error validando disponibilidad' });
    }
  };

  const toggleRecurso = (recurso) => {
    try {
      const key = 'frecuentes_recursos';
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      if (!recursosSeleccionados.some(r => r.idRecurso === recurso.idRecurso)) {
        current[recurso.idRecurso] = (current[recurso.idRecurso] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(current));
        setFrecuentes(current);
      }
    } catch {}

    setRecursosSeleccionados(prev => {
      const ya = prev.find(r => r.idRecurso === recurso.idRecurso);
      if (ya) return prev.filter(r => r.idRecurso !== recurso.idRecurso);
      return [...prev, { ...recurso, horasSolicitadas: 1 }];
    });
  };

  const calcularCostoTotal = () =>
    recursosSeleccionados.reduce((t, r) => {
      const horas = parseInt(r.horasSolicitadas, 10) || (parseInt(duracionHoras, 10) || 1);
      return t + parseFloat(r.tarifaHora) * horas;
    }, 0);

  const tiposDisponibles = Array.from(new Set(recursos.map(x => x.recurso?.idTipo).filter(Boolean)));
  const estadosDisponibles = Array.from(new Set([
    ...recursos.map(x => (x.estadoDisponibilidad || '')).filter(Boolean),
    ...recursos.map(x => (x.recurso?.estado || '')).filter(Boolean)
  ].map(s => String(s)))).filter(Boolean);

  const recursosFiltrados = recursos.filter(x => { const r = x.recurso || {};
    const matchSearch = [r.nombre, r.descripcion, r.ubicacion].filter(Boolean).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchTipo = tipoFiltro ? r.idTipo === tipoFiltro : true;
    const matchEstado = estadoFiltro ? ((r.estado === estadoFiltro) || (x.estadoDisponibilidad === estadoFiltro)) : true;
    return matchSearch && matchTipo && matchEstado;
  });

  const recursosFrecuentes = useMemo(() => {
    try {
      const key = 'frecuentes_recursos';
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      const top = Object.entries(current).sort((a,b) => b[1]-a[1]).slice(0, 5).map(x => x[0]);
      const map = new Map(recursos.map(x => [String(x.recurso?.idRecurso), x.recurso]).filter(([k,v]) => v));
      return top.map(id => map.get(String(id))).filter(Boolean);
    } catch { return []; }
  }, [recursos, frecuentes]);

  if (cargando) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando recursos disponibles...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recursosSeleccionados.length > 0 && (
        <Card className={`p-4 border-2 ${validacionGlobal.valida ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{validacionGlobal.valida ? '✅' : '❌'}</div>
            <div>
              <h3 className="font-semibold">Validación de Selección</h3>
              <p className={`text-sm ${validacionGlobal.valida ? 'text-green-600' : 'text-red-600'}`}>{validacionGlobal.mensaje}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Seleccionar recursos <span className="text-red-500">*</span>
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre, descripción o ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposDisponibles.map(t => <option key={t} value={t}>{tipoNombreMap[t] || t}</option>)}
            </select>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {estadosDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {fechaInicio && (
            <div className="text-xs text-gray-600">
              Mostrando disponibilidad para {(() => { const s = fechaInicio; const m = String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/); if (!m) return ''; const [_, y, mo, d, h, mi, se] = m; const ms = Date.UTC(parseInt(y), parseInt(mo)-1, parseInt(d), parseInt(h), parseInt(mi), parseInt(se||'0')) + (5*60*60*1000); const date = new Date(ms); return date.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }); })()}
            </div>
          )}
        </div>

        {recursos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🚫</div>
            <p>No hay recursos disponibles para el horario seleccionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {recursosFiltrados.map((x) => { const recurso = x.recurso || {};
              const seleccionado = recursosSeleccionados.some(r => r.idRecurso === recurso.idRecurso);
              const estaDisponible = (x.estadoDisponibilidad || '').toLowerCase() === 'disponible';
              return (
                <div
                  key={recurso.idRecurso}
                  className={`p-4 transition-colors ${seleccionado ? 'bg-blue-50' : 'hover:bg-gray-50'} ${!estaDisponible ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => estaDisponible && toggleRecurso(recurso)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-800 mr-2">{recurso.nombre}</h4>
                        {recurso.idTipo && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tipoNombreMap[recurso.idTipo] || recurso.idTipo}</span>
                        )}
                      </div>
                      {recurso.descripcion && <p className="text-sm text-gray-600 mt-1">{recurso.descripcion}</p>}
                      <div className="mt-2 space-y-2">
                        <p className="text-sm"><span className="font-medium">Tarifa:</span> S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/hora</p>
                        {recurso.ubicacion && <p className="text-sm"><span className="font-medium">Ubicación:</span> {recurso.ubicacion}</p>}
                        <div className={`text-sm ${estaDisponible ? 'text-green-700' : 'text-red-700'}`}>
                          {estaDisponible ? '✅ Disponible ahora' : (() => {
                            if (!x.horaDisponible) return '⛔ No disponible';
                            const desde = new Date(fechaInicio);
                            const hasta = new Date(x.horaDisponible);
                            const diffMs = Math.max(0, hasta - desde);
                            const totalMin = Math.round(diffMs / 60000);
                            const horas = Math.floor(totalMin / 60);
                            const mins = totalMin % 60;
                            const enStr = `${horas > 0 ? horas + 'h ' : ''}${mins}min`;
                            const horaStr = hasta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return `⛔ No disponible. Disponible a las ${horaStr} (en ${enStr})`;
                          })()}
                        </div>
                        {seleccionado && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Horas:</label>
                            <input
                              type="number"
                              min={1}
                              value={parseInt(recursosSeleccionados.find(r => r.idRecurso === recurso.idRecurso)?.horasSolicitadas, 10) || 1}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value || '1', 10));
                                setRecursosSeleccionados(prev => prev.map(r => r.idRecurso === recurso.idRecurso ? { ...r, horasSolicitadas: val } : r));
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                            <span className="text-xs text-gray-500">Total: S/. {(parseFloat(recurso.tarifaHora) * (parseInt(recursosSeleccionados.find(r => r.idRecurso === recurso.idRecurso)?.horasSolicitadas, 10) || (parseInt(duracionHoras, 10) || 1))).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <input type="checkbox" readOnly checked={seleccionado} className="w-5 h-5 text-blue-600 border-gray-300 rounded" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
};

export default SeleccionRecursosConValidacion;