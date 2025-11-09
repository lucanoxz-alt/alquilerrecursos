// src/pages/admin/GestionarAlquileresPage.jsx
import React, { useState } from 'react';
import { Package, Users, Calendar, Tag, CreditCard, FileText, Plus, X } from 'lucide-react';
import BusquedaCliente from './components/BusquedaCliente';
import FormularioNuevoCliente from './components/FormularioNuevoCliente';
import SeleccionMetodoPago from './components/SeleccionMetodoPago';
import TarjetaResumenAlquiler from './components/TarjetaResumenAlquiler';

const GestionarAlquileresPage = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');

  const handleClientSelected = (client) => {
    setSelectedClient(client);
    setQueryBusqueda(`${client.nombres} ${client.apellidos}`); // Rellena el campo con el nombre completo
    setShowNewClientForm(false);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQueryBusqueda('');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestionar Alquileres</h1>
        <p className="text-gray-600 mt-2">Registra nuevos alquileres de recursos turísticos.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sección izquierda: Cliente y recursos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleccionar cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <BusquedaCliente
                query={queryBusqueda}
                onQueryChange={setQueryBusqueda}
                onClientSelected={handleClientSelected}
                onShowNewClientForm={() => setShowNewClientForm(true)}
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
            </div>

            {/* Formulario para nuevo cliente */}
            {showNewClientForm && (
              <FormularioNuevoCliente
                onClose={() => setShowNewClientForm(false)}
                onSuccess={handleClientSelected}
              />
            )}

            {/* Seleccionar recursos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Recursos a alquilar <span className="text-red-500">*</span>
                </label>
                <button className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                  <Plus className="w-4 h-4 mr-1" /> Agregar recurso
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-gray-500 text-center py-4">Aún no has agregado recursos.</p>
              </div>
            </div>

            {/* Método de pago */}
            <SeleccionMetodoPago />
          </div>

          {/* Sección derecha: Resumen y acciones */}
          <div className="bg-blue-50 rounded-xl p-6 h-fit">
            <TarjetaResumenAlquiler cliente={selectedClient} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionarAlquileresPage;