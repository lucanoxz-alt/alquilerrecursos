// src/pages/admin/GestionarAlquileresPage.jsx
import React, { useState, useEffect } from 'react';
import { Package, Users, Calendar, Tag, CreditCard, FileText, Plus, X } from 'lucide-react';
import BusquedaCliente from './components/BusquedaCliente';
import FormularioNuevoCliente from './components/FormularioNuevoCliente';
import SeleccionRecursosNuevo from './components/SeleccionRecursosNuevo';
import SeleccionMetodoPago from './components/SeleccionMetodoPago';
import TarjetaResumenAlquiler from './components/TarjetaResumenAlquiler';
import api from '../../../services/api';

const GestionarAlquileresPage = () => {
  console.log('🚀🚀🚀 GESTIONAR ALQUILERES CARGADO - NUEVA VERSION 🚀🚀🚀');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');
  
  // Estados para recursos
  const [recursos, setRecursos] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  
  // Estados para el formulario de alquiler
  const [duracionHoras, setDuracionHoras] = useState(1);
  const [fechaInicio, setFechaInicio] = useState('');

  // Cargar recursos disponibles al montar el componente
  useEffect(() => {
    cargarRecursos();
  }, []);

  // Debug: Monitor selectedClient changes
  useEffect(() => {
    console.log('🔄 selectedClient cambió a:', selectedClient);
  }, [selectedClient]);

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

  const handleClientSelected = (client) => {
    console.log('🏠 GestionarAlquileresPage - handleClientSelected llamado con:', client);
    setSelectedClient(client);
    setQueryBusqueda('');  // CORRECCION CLAVE: Limpiar búsqueda
    setShowNewClientForm(false);
    console.log('🏠 GestionarAlquileresPage - selectedClient actualizado');
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQueryBusqueda('');
  };


  const handleSubmitAlquiler = async (metodoPago) => {
    if (!selectedClient) {
      alert('Por favor selecciona un cliente');
      return;
    }
    
    if (selectedResources.length === 0) {
      alert('Por favor selecciona al menos un recurso');
      return;
    }
    
    if (!fechaInicio) {
      alert('Por favor selecciona una fecha y hora de inicio');
      return;
    }

    try {
      const alquilerData = {
        idTurista: selectedClient.idTurista,
        recursos: selectedResources.map(r => ({
          idRecurso: r.idRecurso,
          horasSolicitadas: r.horasSolicitadas || duracionHoras
        })),
        fechaHoraInicio: fechaInicio,
        metodoPago: metodoPago
      };

      const response = await api.post('/alquileres', alquilerData);
      
      // Limpiar formulario después del éxito
      setSelectedClient(null);
      setSelectedResources([]);
      setFechaInicio('');
      setDuracionHoras(1);
      
      alert('Alquiler registrado exitosamente');
      console.log('Alquiler creado:', response.data);
      
    } catch (error) {
      console.error('Error al crear alquiler:', error);
      alert('Error al registrar el alquiler. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="w-8 h-8 mr-3 text-blue-600" />
          Gestionar Alquileres
        </h1>
        <p className="text-gray-600 mt-2">Registra nuevos alquileres de recursos turísticos</p>
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
            </div>

            {/* Formulario para nuevo cliente */}
            {showNewClientForm && (
              <FormularioNuevoCliente
                onClose={() => setShowNewClientForm(false)}
                onSuccess={handleClientSelected}
              />
            )}

            {/* Seleccionar recursos */}
            <SeleccionRecursosNuevo 
              selectedResources={selectedResources}
              onResourcesChange={setSelectedResources}
            />

            {/* Configuración del alquiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y hora de inicio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (horas) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={duracionHoras}
                  onChange={(e) => setDuracionHoras(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Método de pago */}
            <SeleccionMetodoPago onSubmit={handleSubmitAlquiler} />
          </div>

          {/* Sección derecha: Resumen y acciones */}
          <div className="bg-blue-50 rounded-xl p-6 h-fit">
            <TarjetaResumenAlquiler 
              cliente={selectedClient}
              recursos={selectedResources}
              duracionHoras={duracionHoras}
              fechaInicio={fechaInicio}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionarAlquileresPage;