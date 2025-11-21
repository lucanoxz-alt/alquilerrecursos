// src/pages/admin/GestionarReservasPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Tag, Plus, Search, Edit, Trash2, Filter, RefreshCw, FileText } from 'lucide-react';
import FormularioNuevaReserva from './components/FormularioNuevaReserva';
import ListaReservasRecientes from './components/ListaReservasRecientes';

const GestionarReservasPage = ({ user }) => {
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista' | 'nueva'
  const [searchTerm, setSearchTerm] = useState('');
  const [actualizarLista, setActualizarLista] = useState(0);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const handleReservaCreada = (nuevaReserva) => {
    console.log('Nueva reserva creada:', nuevaReserva);
    setActualizarLista(prev => prev + 1); // Trigger para actualizar la lista
    setVistaActual('lista'); // Volver a la vista de lista
  };

  const handleVerDetalle = (reserva) => {
    setReservaSeleccionada(reserva);
    // Aquí podrías abrir un modal o navegar a una vista de detalle
    console.log('Ver detalle de reserva:', reserva);
  };

  const renderVistaActual = () => {
    switch (vistaActual) {
      case 'nueva':
        return (
          <FormularioNuevaReserva
            onReservaCreada={handleReservaCreada}
            onCerrar={() => setVistaActual('lista')}
          />
        );
      case 'lista':
      default:
        return (
          <>
            {/* Barra de búsqueda y filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center flex-1 max-w-md">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Buscar reservas..."
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </button>
                  <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de reservas */}
            <ListaReservasRecientes
              actualizarLista={actualizarLista}
              onVerDetalle={handleVerDetalle}
            />
          </>
        );
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestionar Reservas</h1>
            <p className="text-gray-600 mt-2">Registra y gestiona las reservas de recursos turísticos.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {vistaActual === 'lista' && (
              <button
                onClick={() => setVistaActual('nueva')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reserva
              </button>
            )}
            
            {vistaActual === 'nueva' && (
              <button
                onClick={() => setVistaActual('lista')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Reservas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Renderizar vista actual */}
      {renderVistaActual()}
    </div>
  );
};

export default GestionarReservasPage;