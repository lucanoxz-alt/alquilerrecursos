// src/pages/admin/GestionarAlquileres/components/BusquedaCliente.jsx
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '@/services/api'; // Asegúrate de que la ruta sea correcta

const BusquedaCliente = ({ query, onQueryChange, onClientSelected, onShowNewClientForm }) => {
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const buscarClientes = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResultadosBusqueda([]);
      setMostrarResultados(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/turistas/buscar?query=${encodeURIComponent(searchQuery)}`);
      setResultadosBusqueda(response.data);
      setMostrarResultados(true);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      setResultadosBusqueda([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim() !== '') {
        buscarClientes(query);
      } else {
        setResultadosBusqueda([]);
        setMostrarResultados(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const seleccionarCliente = (cliente) => {
    onClientSelected(cliente);
    setMostrarResultados(false); // Cierra la lista de resultados
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => query && setMostrarResultados(true)}
            onBlur={() => setMostrarResultados(false)}
            placeholder="Buscar por nombre o DNI"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5 text-blue-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
          {mostrarResultados && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
              {resultadosBusqueda.length > 0 ? (
                resultadosBusqueda.map((cliente) => (
                  <div
                    key={cliente.idTurista}
                    onClick={() => seleccionarCliente(cliente)}
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
          onClick={onShowNewClientForm}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>
    </div>
  );
};

export default BusquedaCliente;