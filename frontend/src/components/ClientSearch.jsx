// src/components/ClientSearch.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Componente que permite buscar clientes y seleccionar uno
// Se comunica con el componente padre mediante onClientSelected
const ClientSearch = ({ onClientSelected }) => {

  // Texto que escribe el usuario
  const [query, setQuery] = useState('');

  // Resultados obtenidos desde el backend
  const [results, setResults] = useState([]);

  // Controla si se muestra el dropdown de resultados
  const [showResults, setShowResults] = useState(false);

  // Indica si se está cargando la búsqueda
  const [isLoading, setIsLoading] = useState(false);

  // Función que consulta al backend
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      // Llamada a la API para buscar turistas
      const response = await api.get(
        `/turistas/buscar?query=${encodeURIComponent(searchQuery)}`
      );
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce: espera 300 ms antes de buscar
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim() !== '') {
        handleSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Cuando el usuario selecciona un cliente
  const selectClient = (client) => {
    onClientSelected(client); // avisa al componente padre
    setQuery(`${client.nombres} ${client.apellidos}`);
    setShowResults(false);
  };

  return (
    <div className="relative">
      {/* Etiqueta */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cliente <span className="text-red-500">*</span>
      </label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          {/* Input de búsqueda */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setShowResults(true)}
            onBlur={() => setShowResults(false)}
            placeholder="Buscar por nombre o DNI"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />

          {/* Spinner de carga */}
          {isLoading && (
            <div className="absolute right-3 top-2.5 text-blue-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Lista de resultados */}
          {showResults && (
            <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
              {results.length > 0 ? (
                results.map((cliente) => (
                  <div
                    key={cliente.idTurista}
                    onClick={() => selectClient(cliente)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="font-medium">
                      {cliente.nombres} {cliente.apellidos}
                    </div>
                    <div className="text-sm text-gray-500">
                      DNI: {cliente.dniPasaporte}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">
                  No se encontraron clientes
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón para crear nuevo cliente */}
        <button
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Nuevo
        </button>
      </div>
    </div>
  );
};

export default ClientSearch;