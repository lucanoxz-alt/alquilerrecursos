// src/pages/admin/GestionarAlquileres/components/GestionCliente.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import BusquedaCliente from './BusquedaCliente';
import FormularioNuevoCliente from './FormularioNuevoCliente';

const GestionCliente = ({ selectedClient, onClientSelected, onClearClient }) => {
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');

  const handleClientSelected = (client) => {
    console.log('🎯 GestionCliente - handleClientSelected llamado con:', client);
    onClientSelected(client);
    setQueryBusqueda(''); // Limpiar después de seleccionar
    setShowNewClientForm(false);
    console.log('🎯 GestionCliente - Estado limpiado, llamando onClientSelected del padre');
  };

  const handleClearClient = () => {
    onClearClient();
    setQueryBusqueda('');
  };

  const handleNewClientSuccess = (client) => {
    handleClientSelected(client);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cliente <span className="text-red-500">*</span>
      </label>
      
      <BusquedaCliente
        query={queryBusqueda}
        onQueryChange={setQueryBusqueda}
        onClientSelected={handleClientSelected}
        onShowNewClientForm={() => setShowNewClientForm(true)}
        selectedClient={selectedClient}
      />
      
      {selectedClient && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <span className="text-sm text-green-700">
            <strong>Cliente seleccionado:</strong> {selectedClient.nombres} {selectedClient.apellidos} ({selectedClient.dniPasaporte})
          </span>
          <button
            onClick={handleClearClient}
            className="text-green-700 hover:text-green-900"
            title="Quitar cliente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showNewClientForm && (
        <FormularioNuevoCliente
          onClose={() => setShowNewClientForm(false)}
          onSuccess={handleNewClientSuccess}
        />
      )}
    </div>
  );
};

export default GestionCliente;