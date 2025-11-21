// src/pages/admin/GestionarAlquileres/components/SeleccionRecursosNuevo.jsx
import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, X, Plus } from 'lucide-react';
import api from '../../../../services/api';

const SeleccionRecursosNuevo = ({ selectedResources, onResourcesChange }) => {
  const [showFullInterface, setShowFullInterface] = useState(false);
  const [recursos, setRecursos] = useState([]);
  const [recursosRecientes, setRecursosRecientes] = useState([]);
  const [tiposRecursos, setTiposRecursos] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [filteredRecursos, setFilteredRecursos] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    filtrarRecursos();
  }, [recursos, searchQuery, selectedTipo]);

  const cargarDatosIniciales = async () => {
    setLoadingResources(true);
    try {
      // Cargar recursos disponibles
      const [recursosResponse, tiposResponse] = await Promise.all([
        api.get('/recursos/disponibles'),
        api.get('/tipos-recursos')
      ]);
      
      setRecursos(recursosResponse.data);
      setTiposRecursos(tiposResponse.data);
      
      // Simular recursos recientes (podrías obtenerlos del localStorage o API)
      const recientes = recursosResponse.data.slice(0, 4);
      setRecursosRecientes(recientes);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const filtrarRecursos = () => {
    let filtered = recursos;

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
      filtered = filtered.filter(recurso => recurso.tipoRecurso?.idTipoRecurso === selectedTipo);
    }

    setFilteredRecursos(filtered);
  };

  const handleResourceToggle = (recurso) => {
    const isSelected = selectedResources.some(r => r.idRecurso === recurso.idRecurso);
    let newSelectedResources;
    
    if (isSelected) {
      newSelectedResources = selectedResources.filter(r => r.idRecurso !== recurso.idRecurso);
    } else {
      newSelectedResources = [...selectedResources, recurso];
    }
    
    onResourcesChange(newSelectedResources);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTipo('');
  };

  if (showFullInterface) {
    return (
      <div className="space-y-4">
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
                <option key={tipo.idTipoRecurso} value={tipo.idTipoRecurso}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          {(searchQuery || selectedTipo) && (
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
                  return (
                    <div
                      key={recurso.idRecurso}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleResourceToggle(recurso)}
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
                                {recurso.tipoRecurso && (
                                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {recurso.tipoRecurso.nombre}
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
                              <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                recurso.estado === 'disponible' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {recurso.estado}
                              </div>
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
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm font-medium">{recurso.nombre}</span>
                    <span className="ml-2 text-sm text-green-600">
                      S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/h
                    </span>
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
        Recursos a alquilar <span className="text-red-500">*</span>
      </label>

      {/* Recursos recientes/sugeridos */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-600">Recursos frecuentes</h4>
        
        {loadingResources ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recursosRecientes.map((recurso) => {
              const isSelected = selectedResources.some(r => r.idRecurso === recurso.idRecurso);
              return (
                <div
                  key={recurso.idRecurso}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleResourceToggle(recurso)}
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

      {/* Botón ver todos */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowFullInterface(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Ver todos los recursos</span>
        </button>
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

export default SeleccionRecursosNuevo;