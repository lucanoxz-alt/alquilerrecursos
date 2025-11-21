// src/pages/admin/GestionarAlquileres/components/SeleccionRecursos.jsx
import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import api from '../../../../services/api';

const SeleccionRecursos = ({ selectedResources, onResourcesChange }) => {
  const [recursos, setRecursos] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    cargarRecursos();
  }, []);

  const cargarRecursos = async () => {
    setLoadingResources(true);
    try {
      const response = await api.get('/recursos');
      setRecursos(response.data);
    } catch (error) {
      console.error('Error al cargar recursos:', error);
    } finally {
      setLoadingResources(false);
    }
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

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Recursos a alquilar <span className="text-red-500">*</span>
        </label>
      </div>
      
      {loadingResources ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Cargando recursos...
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
          {recursos.length > 0 ? (
            recursos.map((recurso) => {
              const isSelected = selectedResources.some(r => r.idRecurso === recurso.idRecurso);
              return (
                <div
                  key={recurso.idRecurso}
                  className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleResourceToggle(recurso)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleResourceToggle(recurso)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            {recurso.nombre}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {recurso.descripcion}
                          </div>
                          {recurso.ubicacion && (
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              📍 {recurso.ubicacion}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/hora
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
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
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay recursos disponibles
            </div>
          )}
        </div>
      )}

      {/* Recursos seleccionados */}
      {selectedResources.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">
            Recursos seleccionados ({selectedResources.length})
          </div>
          <div className="space-y-1">
            {selectedResources.map((recurso) => (
              <div key={recurso.idRecurso} className="text-sm text-blue-700">
                • {recurso.nombre} - S/. {parseFloat(recurso.tarifaHora).toFixed(2)}/hora
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeleccionRecursos;