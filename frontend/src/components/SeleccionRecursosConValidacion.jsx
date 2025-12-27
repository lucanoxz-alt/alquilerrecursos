import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import DisponibilidadChecker from '@/components/DisponibilidadChecker';
import { disponibilidadService } from '@/services/api';

const SeleccionRecursosConValidacion = ({ 
  onRecursosSeleccionados, 
  fechaInicio, 
  duracionHoras 
}) => {
  const [recursosDisponibles, setRecursosDisponibles] = useState([]);
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [frecuentes, setFrecuentes] = useState({});
  const [recursosSeleccionados, setRecursosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [validacionGlobal, setValidacionGlobal] = useState({
    valida: false,
    mensaje: ''
  });

  // Cargar recursos disponibles cuando cambian los parámetros
  useEffect(() => {
    if (fechaInicio) {
      cargarRecursosDisponibles();
    }
  }, [fechaInicio, duracionHoras]);

  // Validar selección cuando cambian los recursos seleccionados
  useEffect(() => {
    if (recursosSeleccionados.length > 0 && fechaInicio && duracionHoras) {
      validarSeleccionCompleta();
    }
  }, [recursosSeleccionados, fechaInicio, duracionHoras]);

  const cargarRecursosDisponibles = async () => {
    setCargando(true);
    try {
      const data = await disponibilidadService.obtenerRecursosDisponibles(
        fechaInicio,
        duracionHoras || 1
      );
      setRecursosDisponibles(data.recursosDisponibles);
    } catch (error) {
      console.error('Error cargando recursos:', error);
      setRecursosDisponibles([]);
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
      const resultado = await disponibilidadService.verificarMultiple(
        idsSeleccionados,
        fechaInicio,
        duracionHoras
      );

      setValidacionGlobal({
        valida: resultado.todosDisponibles,
        mensaje: resultado.todosDisponibles 
          ? 'Todos los recursos están disponibles' 
          : 'Algunos recursos no están disponibles'
      });

      // Notificar al componente padre
      if (onRecursosSeleccionados) {
        onRecursosSeleccionados({
          recursos: recursosSeleccionados,
          valida: resultado.todosDisponibles,
          detalles: resultado
        });
      }
    } catch (error) {
      console.error('Error validando selección:', error);
      setValidacionGlobal({ 
        valida: false, 
        mensaje: 'Error validando disponibilidad' 
      });
    }
  };

  const toggleRecurso = (recurso) => {
    // actualizar frecuencia en localStorage
    try {
      const key = 'frecuentes_recursos';
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      if (recursosSeleccionados.some(r => r.idRecurso === recurso.idRecurso)) {
        // si deselecciona, no incrementamos
      } else {
        current[recurso.idRecurso] = (current[recurso.idRecurso] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(current));
        setFrecuentes(current);
      }
    } catch {}

    setRecursosSeleccionados(prev => {
      const yaSeleccionado = prev.find(r => r.idRecurso === recurso.idRecurso);
      
      if (yaSeleccionado) {
        // Remover del array
        return prev.filter(r => r.idRecurso !== recurso.idRecurso);
      } else {
        // Agregar al array con horasSolicitadas por defecto
        return [...prev, { ...recurso, horasSolicitadas: 1 }];
      }
    });
  };

  const estaSeleccionado = (recurso) => {
    return recursosSeleccionados.some(r => r.idRecurso === recurso.idRecurso);
  };

  const calcularCostoTotal = () => {
    return recursosSeleccionados.reduce((total, recurso) => {
      const horas = parseInt(recurso.horasSolicitadas, 10) || (parseInt(duracionHoras, 10) || 1);
      return total + (parseFloat(recurso.tarifaHora) * horas);
    }, 0);
  };

  const tiposDisponibles = Array.from(new Set(recursosDisponibles.map(r => r.idTipo).filter(Boolean)));
  const estadosDisponibles = ['Disponible'];

  const recursosFiltrados = recursosDisponibles.filter(r => {
    const matchSearch = [r.nombre, r.descripcion, r.ubicacion].filter(Boolean).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchTipo = tipoFiltro ? r.idTipo === tipoFiltro : true;
    const matchEstado = estadoFiltro ? (r.estado === estadoFiltro) : true;
    return matchSearch && matchTipo && matchEstado;
  });

  const recursosFrecuentes = React.useMemo(() => {
    try {
      const key = 'frecuentes_recursos';
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      const entries = Object.entries(current).sort((a,b) => b[1]-a[1]).slice(0,5);
      const ids = entries.map(e => e[0]);
      const map = new Map(recursosDisponibles.map(r => [String(r.idRecurso), r]));
      return ids.map(id => map.get(String(id))).filter(Boolean);
    } catch { return []; }
  }, [recursosDisponibles, frecuentes]);

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
      {/* Estado de validación global */}
      {recursosSeleccionados.length > 0 && (
        <Card className={`p-4 border-2 ${
          validacionGlobal.valida 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {validacionGlobal.valida ? '✅' : '❌'}
            </div>
            <div>
              <h3 className="font-semibold">
                Validación de Selección
              </h3>
              <p className={`text-sm ${
                validacionGlobal.valida ? 'text-green-600' : 'text-red-600'
              }`}>
                {validacionGlobal.mensaje}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recursos disponibles */}
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
              {tiposDisponibles.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {estadosDisponibles.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          {fechaInicio && (
            <div className="text-xs text-gray-600">Mostrando disponibilidad para {new Date(fechaInicio).toLocaleString()} por {duracionHoras} hora(s)</div>
          )}
        </div>

        {recursosDisponibles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🚫</div>
            <p>No hay recursos disponibles para el horario seleccionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recursosFiltrados.map((recurso) => {
              const seleccionado = estaSeleccionado(recurso);
              return (
                <div
                  key={recurso.idRecurso}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    seleccionado
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleRecurso(recurso)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {recurso.nombre}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {recurso.descripcion}
                      </p>
                      <div className="mt-2 space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Tarifa:</span> 
                          S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/hora
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Ubicación:</span> 
                          {recurso.ubicacion}
                        </p>
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
                      <input
                        type="checkbox"
                        readOnly
                        checked={seleccionado}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Resumen de selección */}
      {recursosSeleccionados.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            Resumen de Selección
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Recursos seleccionados:</span> {recursosSeleccionados.length}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Duración total:</span> {duracionHoras * recursosSeleccionados.length} horas-recurso
            </p>
            {duracionHoras && (
              <p className="text-lg font-semibold text-blue-800">
                <span className="font-medium">Costo total estimado:</span> ${calcularCostoTotal().toFixed(2)}
              </p>
            )}
          </div>

          <div className="mt-3 flex space-x-2">
            <Button
              onClick={() => setRecursosSeleccionados([])}
              variant="outline"
              size="sm"
            >
              Limpiar Selección
            </Button>
            <Button
              onClick={validarSeleccionCompleta}
              variant="primary"
              size="sm"
              disabled={!validacionGlobal.valida}
            >
              Revalidar Disponibilidad
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SeleccionRecursosConValidacion;