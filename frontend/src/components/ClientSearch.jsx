// src/components/ClientSearch.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ClientSearch = ({ onClientSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/turistas/buscar?query=${encodeURIComponent(searchQuery)}`);
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const selectClient = (client) => {
    onClientSelected(client);
    setQuery(`${client.nombres} ${client.apellidos}`);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cliente <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setShowResults(true)}
            onBlur={() => setShowResults(false)} // 👈 Nuevo
            placeholder="Buscar por nombre o DNI"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5 text-blue-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
          {showResults && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
              {results.length > 0 ? (
                results.map((cliente) => (
                  <div
                    key={cliente.idTurista}
                    onClick={() => selectClient(cliente)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{cliente.nombres} {cliente.apellidos}</div>
                    <div className="text-sm text-gray-500">DNI: {cliente.dniPasaporte}</div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No se encontraron clientes</div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => {/* Aquí podrías abrir un modal o navegar */}}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>
    </div>
  );
};

export default ClientSearch;