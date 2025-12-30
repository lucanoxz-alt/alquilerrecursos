// src/pages/admin/GestionarAlquileres/components/BusquedaCliente.jsx
import React, { useState, useEffect } from 'react';
import { Plus, User, CreditCard, Search } from 'lucide-react';
import api from '../../../../services/api';

const BusquedaCliente = ({ query, onQueryChange, onClientSelected, onShowNewClientForm, selectedClient }) => {
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
      // Intentar API real primero
      const response = await api.get(`/turistas/buscar?query=${encodeURIComponent(searchQuery)}`);
      setResultadosBusqueda(response.data);
      setMostrarResultados(true);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setResultadosBusqueda([]);
      setMostrarResultados(true);
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
    console.log('🔍 BusquedaCliente - seleccionarCliente llamado con:', cliente);
    onClientSelected(cliente);
    setMostrarResultados(false); // Cierra la lista de resultados
    console.log('🔍 BusquedaCliente - onClientSelected ejecutado, cerrando resultados');
  };

  const handleBlur = () => {
    // Delay para permitir que el click se ejecute antes del blur
    setTimeout(() => {
      setMostrarResultados(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={selectedClient ? `${selectedClient.nombres} ${selectedClient.apellidos} (${selectedClient.dniPasaporte})` : query}
            onChange={selectedClient ? () => {} : (e) => onQueryChange(e.target.value)}
            onFocus={() => !selectedClient && query && setMostrarResultados(true)}
            onBlur={selectedClient ? () => {} : handleBlur}
            placeholder={selectedClient ? "" : "Buscar por nombre o DNI"}
            disabled={selectedClient}
            readOnly={selectedClient}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              selectedClient ? 'bg-green-50 text-green-800 cursor-not-allowed border-green-300' : ''
            }`}
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5 text-blue-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
          {mostrarResultados && !selectedClient && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
              {resultadosBusqueda.length > 0 ? (
                resultadosBusqueda.map((cliente) => (
                  <div
                    key={cliente.idTurista}
                    onClick={() => seleccionarCliente(cliente)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-500" />
                      {cliente.nombres} {cliente.apellidos}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      DNI: {cliente.dniPasaporte}
                    </div>
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