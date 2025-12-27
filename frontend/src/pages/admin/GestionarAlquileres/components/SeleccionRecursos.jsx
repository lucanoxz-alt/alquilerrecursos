// src/pages/admin/GestionarAlquileres/components/SeleccionRecursosNuevo.jsx
import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, X, Plus } from 'lucide-react';
import api, { recursoService, disponibilidadService } from '../../../../services/api';

const SeleccionRecursos = ({ selectedResources, onResourcesChange, fechaInicio, duracionHoras, label = 'Recursos a alquilar' }) => {
  const [showFullInterface, setShowFullInterface] = useState(false);
  const [recursos, setRecursos] = useState([]);
  const [recursosRecientes, setRecursosRecientes] = useState([]);
  const [tiposRecursos, setTiposRecursos] = useState([]);
  const [tiposMap, setTiposMap] = useState({});
  const [loadingResources, setLoadingResources] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [filteredRecursos, setFilteredRecursos] = useState([]);
  const [availableSet, setAvailableSet] = useState(new Set());

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    filtrarRecursos();
  }, [recursos, searchQuery, selectedTipo, selectedEstado, availableSet]);

  useEffect(() => {
    // Cargar disponibilidad cuando cambia la fecha/hora o la lista de recursos
    const cargarDisponibilidad = async () => {
      if (!fechaInicio || !duracionHoras || !Array.isArray(recursos) || recursos.length === 0) {
        // Sin configuración de tiempo, tratamos todo como potencialmente disponible (no bloqueamos selección)
        setAvailableSet(null);
        return;
      }
      try {
        const disponibles = await disponibilidadService.obtenerRecursosDisponibles(fechaInicio, duracionHoras);
        const ids = new Set((Array.isArray(disponibles) ? disponibles : []).map(r => r.idRecurso));
        setAvailableSet(ids);
      } catch (e) {
        console.warn('No se pudo cargar disponibilidad:', e);
        setAvailableSet(null);
      }
    };
    cargarDisponibilidad();
  }, [fechaInicio, duracionHoras, recursos]);

  const cargarDatosIniciales = async () => {
    setLoadingResources(true);
    try {
      // Cargar todos los recursos
      const recursosData = await recursoService.obtenerTodos();
      setRecursos(recursosData);
      
      // Cargar tipos de recursos desde backend para usar IDs reales
      try {
        const tipos = await api.get('/tipos-recursos').then(r => r.data);
        const lista = Array.isArray(tipos) ? tipos : [];
        setTiposRecursos(lista);
        const map = {};
        lista.forEach(t => { if (t.idTipo) map[t.idTipo] = t.nombre; });
        setTiposMap(map);
      } catch (e) {
        // Fallback: derivar de los recursos si el endpoint falla
        const tiposUnicos = [...new Set(recursosData.map(r => r.idTipo).filter(Boolean))];
        const tiposFormateados = tiposUnicos.map((id, idx) => ({
          idTipo: id,
          nombre: id
        }));
        setTiposRecursos(tiposFormateados);
        const map = {};
        tiposFormateados.forEach(t => { if (t.idTipo) map[t.idTipo] = t.nombre; });
        setTiposMap(map);
      }
      
      // Obtener recursos recientemente alquilados (simulación con datos reales)
      try {
        const alquileresData = await api.get('/alquileres').then(r => r.data).catch(() => []);
        const recursosRecientesIds = [...new Set(alquileresData
          .filter(a => a.estadoalquiler === 'Finalizado')
          .sort((a, b) => new Date(b.fechaHoraInicio) - new Date(a.fechaHoraInicio))
          .slice(0, 6)
          .flatMap(a => a.detalles?.map(d => d.idRecurso) || [])
        )];
        
        const recientes = recursosData
          .filter(r => recursosRecientesIds.includes(r.idRecurso) && r.estado === 'Disponible')
          .slice(0, 4);
          
        setRecursosRecientes(recientes.length > 0 ? recientes : 
          recursosData.filter(r => r.estado === 'Disponible').slice(0, 4)
        );
      } catch {
        // Fallback: recursos disponibles más recientes por ID
        const recientes = recursosData.filter(r => r.estado === 'Disponible').slice(0, 4);
        setRecursosRecientes(recientes);
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      // Sin mock: si falla, dejamos vacías las listas y mostramos el estado de carga
      setRecursos([]);
      setTiposRecursos([]);
      setRecursosRecientes([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const filtrarRecursos = () => {
    let filtered = recursos;

    // Filtrar por estado
    if (selectedEstado) {
      const estado = selectedEstado;
      if (estado === 'Disponible') {
        filtered = filtered.filter(recurso => (recurso.estado === 'Disponible') && (!availableSet || availableSet.has(recurso.idRecurso)));
      } else {
        filtered = filtered.filter(recurso => recurso.estado === estado);
      }
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(recurso => 
        recurso.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recurso.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recurso.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (selectedTipo) {
      filtered = filtered.filter(recurso => recurso.idTipo === selectedTipo);
    }

    setFilteredRecursos(filtered);
  };

  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState('');

  const handleResourceToggle = (recurso, isDisponibleOverride = true) => {
    const isSelected = selectedResources.some(r => r.idRecurso === recurso.idRecurso);
    let newSelectedResources;

    if (!isDisponibleOverride) {
      setMensajeDisponibilidad(`El recurso "${recurso.nombre}" no está disponible en la fecha/hora seleccionada`);
      setTimeout(() => setMensajeDisponibilidad(''), 4000);
      return; // bloquear selección
    }
    
    if (isSelected) {
      newSelectedResources = selectedResources.filter(r => r.idRecurso !== recurso.idRecurso);
    } else {
      newSelectedResources = [...selectedResources, { ...recurso, horasSolicitadas: 1 }];
    }
    
    onResourcesChange(newSelectedResources);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTipo('');
    setSelectedEstado('');
  };

  if (showFullInterface) {
    return (
      <div className="space-y-4">
        {mensajeDisponibilidad && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {mensajeDisponibilidad}
          </div>
        )}
        {/* Header con botón de cerrar */}
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Seleccionar recursos <span className="text-red-500">*</span>
          </label>
          <button
            onClick={() => setShowFullInterface(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, descripción o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposRecursos.map(tipo => (
                <option key={tipo.idTipo || tipo.idTipoRecurso} value={tipo.idTipo || tipo.idTipoRecurso}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Disponible">✅ Disponible</option>
              <option value="Alquilado">🔴 Alquilado</option>
              <option value="Mantenimiento">🔧 Mantenimiento</option>
              <option value="Reservado">📅 Reservado</option>
              <option value="Fuera de Servicio">⛔ Fuera de Servicio</option>
            </select>
          </div>
          
          {(searchQuery || selectedTipo || selectedEstado) && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredRecursos.length} recursos encontrados
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de recursos */}
        {loadingResources ? (
          <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Cargando recursos...
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {filteredRecursos.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredRecursos.map((recurso) => {
                  const isSelected = selectedResources.some(r => r.idRecurso === recurso.idRecurso);
                  const estadoRecurso = (recurso.estado || '').toString().toLowerCase();
                  const permitidoPorEstado = estadoRecurso === 'disponible';
                  const disponiblePorTiempo = !availableSet || availableSet.has(recurso.idRecurso);
                  const isDisponible = permitidoPorEstado && disponiblePorTiempo;
                  return (
                    <div
                      key={recurso.idRecurso}
                      className={`p-4 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                      } ${!isDisponible ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => isDisponible && handleResourceToggle(recurso)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium text-gray-900">{recurso.nombre}</span>
                                {recurso.idTipo && (
                                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {tiposMap[recurso.idTipo] || recurso.idTipo}
                                  </span>
                                )}
                              </div>
                              {recurso.descripcion && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {recurso.descripcion}
                                </div>
                              )}
                              {recurso.ubicacion && (
                                <div className="text-xs text-gray-400 flex items-center mt-1">
                                  📍 {recurso.ubicacion}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold text-green-600 text-lg">
                                S/. {parseFloat(recurso.tarifaHora).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">por hora</div>
                              {recurso.estado && (
                                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                  (recurso.estado || '').toString().toLowerCase() === 'disponible'
                                    ? 'bg-green-100 text-green-800'
                                    : (recurso.estado || '').toString().toLowerCase() === 'alquilado'
                                    ? 'bg-red-100 text-red-800'
                                    : (recurso.estado || '').toString().toLowerCase() === 'mantenimiento'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : (recurso.estado || '').toString().toLowerCase() === 'reservado'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {recurso.estado}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <div className="font-medium">No se encontraron recursos</div>
                <div className="text-sm">Prueba ajustando los filtros de búsqueda</div>
              </div>
            )}
          </div>
        )}

        {/* Recursos seleccionados */}
        {selectedResources.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">
                Recursos seleccionados ({selectedResources.length})
              </h4>
              <button
                onClick={() => onResourcesChange([])}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Limpiar selección
              </button>
            </div>
           <div className="grid grid-cols-1 gap-2">
             {selectedResources.map((recurso) => (
               <div key={recurso.idRecurso} className="flex items-center justify-between bg-white p-2 rounded border">
                 <div className="flex items-center gap-2">
                   <Package className="w-4 h-4 text-gray-400" />
                   <span className="text-sm font-medium">{recurso.nombre}</span>
                   <span className="text-sm text-green-600">S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/h</span>
                   <div className="flex items-center gap-1 ml-2">
                     <span className="text-xs text-gray-500">Horas:</span>
                     <input
                       type="number"
                       min="1"
                       max="24"
                       value={recurso.horasSolicitadas || 1}
                       onChange={(e) => {
                         const v = parseInt(e.target.value, 10) || 1;
                         const updated = selectedResources.map(r => r.idRecurso === recurso.idRecurso ? { ...r, horasSolicitadas: v } : r);
                         onResourcesChange(updated);
                       }}
                       className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                     />
                   </div>
                 </div>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleResourceToggle(recurso);
                   }}
                   className="text-red-500 hover:text-red-700 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
             ))}
           </div>
          </div>
        )}
      </div>
    );
  }

  // Vista compacta inicial
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Recursos recientes/sugeridos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-600">Recursos frecuentes</h4>
          <button
            onClick={() => setShowFullInterface(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Ver todos</span>
          </button>
        </div>
        
        {loadingResources ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recursosRecientes.map((recurso) => {
              const isSelected = selectedResources.some(r => r.idRecurso === recurso.idRecurso);
              const estadoRecurso = (recurso.estado || '').toString().toLowerCase();
              const permitidoPorEstado = estadoRecurso === 'disponible';
              const disponiblePorTiempo = !availableSet || availableSet.has(recurso.idRecurso);
              const isDisponible = permitidoPorEstado && disponiblePorTiempo;
              return (
                <div
                  key={recurso.idRecurso}
                  className={`border rounded-lg p-3 transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${!isDisponible ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => isDisponible && handleResourceToggle(recurso)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900 text-sm">{recurso.nombre}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/hora
                      </div>
                      {recurso.ubicacion && (
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {recurso.ubicacion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recursos seleccionados resumen */}
      {selectedResources.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedResources.length} recurso{selectedResources.length > 1 ? 's' : ''} seleccionado{selectedResources.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowFullInterface(true)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeleccionRecursos;