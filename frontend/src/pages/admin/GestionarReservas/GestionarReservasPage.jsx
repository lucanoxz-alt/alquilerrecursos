// src/pages/admin/GestionarReservasPage.jsx
import React, { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import BusquedaCliente from '../GestionarAlquileres/components/BusquedaCliente';
import FormularioNuevoCliente from '../GestionarAlquileres/components/FormularioNuevoCliente';
import SeleccionRecursos from '../GestionarAlquileres/components/SeleccionRecursos';
import SeleccionMetodoPago from '../GestionarAlquileres/components/SeleccionMetodoPago';
import TarjetaResumenReserva from './components/TarjetaResumenReserva';
import ListaReservasRecientes from './components/ListaReservasRecientes';
import api, { promocionService, reservaService, getCurrentUserId } from '../../../services/api';

const GestionarReservasPage = () => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [actualizarLista, setActualizarLista] = useState(0);

  // Cliente
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');

  // Recursos seleccionados (reutilizamos el mismo selector)
  const [selectedResources, setSelectedResources] = useState([]);

  // Fecha/hora de inicio prevista para la reserva
  const [fechaHoraInicioPrevista, setFechaHoraInicioPrevista] = useState('');

  const handleClientSelected = (client) => {
    setSelectedClient(client);
    setQueryBusqueda('');
    setShowNewClientForm(false);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQueryBusqueda('');
  };

  // Para disponibilidad y resumen, calculamos total de horas solicitadas como en alquileres
  const totalHoras = selectedResources.reduce(
    (sum, r) => sum + (parseInt(r.horasSolicitadas, 10) || 0),
    0
  );

  // Promociones (mismo flujo visual que Alquileres)
  const [promosActivas, setPromosActivas] = React.useState([]);
  const [promoAplicable, setPromoAplicable] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const promos = await promocionService.obtenerActivas();
        setPromosActivas(Array.isArray(promos) ? promos : []);
      } catch (e) {
        setPromosActivas([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!Array.isArray(promosActivas) || promosActivas.length === 0 || totalHoras <= 0) {
      setPromoAplicable(null);
      return;
    }
    const elegibles = promosActivas.filter(p => (p.activa !== false) && (parseInt(p.condicionMinima, 10) || 0) <= totalHoras);
    if (elegibles.length === 0) {
      setPromoAplicable(null);
      return;
    }
    const mejor = elegibles.reduce((best, p) => {
      const pct = parseFloat(p.porcentajeDesc || p.porcentajeDescuento || 0);
      const bestPct = parseFloat(best?.porcentajeDesc || best?.porcentajeDescuento || 0);
      return pct > bestPct ? p : best;
    }, null);
    setPromoAplicable(mejor);
  }, [promosActivas, totalHoras]);

  const handleSubmitReserva = async (metodoPago) => {
    if (!selectedClient) {
      alert('Por favor selecciona un turista');
      return;
    }
    if (!fechaHoraInicioPrevista) {
      alert('Por favor selecciona fecha y hora de inicio');
      return;
    }
    if (selectedResources.length === 0) {
      alert('Por favor selecciona al menos un recurso');
      return;
    }

    try {
      const reservaData = {
        idTurista: selectedClient.idTurista,
        fechaHoraInicioPrevista,
        idPromocion: promoAplicable?.idPromocion || null,
        metodoPago: metodoPago,
        idUsuarioGestor: getCurrentUserId(),
        recursos: selectedResources.map((r) => ({
          idRecurso: r.idRecurso,
          horasSolicitadas: parseInt(r.horasSolicitadas, 10) || 1,
        })),
      };

      const reservaCreada = await reservaService.crear(reservaData);

      // Intentar descargar comprobante de pago de reserva (adelanto 50%)
      try {
        const { data } = await api.get(`/comprobantes-pago-reserva/reserva/${reservaCreada.idReserva}/pdf`, { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante_reserva_${reservaCreada.idReserva}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (e) {
        console.warn('Reserva creada, pero no se pudo abrir el comprobante automáticamente:', e);
      }

      // Limpiar y volver a lista
      setSelectedClient(null);
      setSelectedResources([]);
      setFechaHoraInicioPrevista('');
      setActualizarLista((prev) => prev + 1);
      setVistaActual('lista');
      alert('Reserva registrada exitosamente');
    } catch (error) {
      console.error('Error al crear reserva:', error);
      const serverMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
      alert('Error al registrar la reserva: ' + serverMsg);
    }
  };

  const renderVista = () => {
    if (vistaActual === 'lista') {
      return (
        <ListaReservasRecientes
          actualizarLista={actualizarLista}
          onVerDetalle={() => {}}
        />
      );
    }

    // Vista 'nueva' idéntica al layout de Gestionar Alquileres
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda: Cliente, recursos y configuración */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleccionar cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turista <span className="text-red-500">*</span>
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
                    <strong>Turista seleccionado:</strong> {selectedClient.nombres} {selectedClient.apellidos} ({selectedClient.dniPasaporte})
                  </span>
                  <button
                    onClick={handleClearClient}
                    className="text-green-700 hover:text-green-900"
                    title="Quitar turista"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Formulario para nuevo turista */}
            {showNewClientForm && (
              <FormularioNuevoCliente
                onClose={() => setShowNewClientForm(false)}
                onSuccess={handleClientSelected}
              />
            )}

            {/* Seleccionar recursos (reutilizado) */}
            <SeleccionRecursos
              selectedResources={selectedResources}
              onResourcesChange={setSelectedResources}
              fechaInicio={fechaHoraInicioPrevista}
              duracionHoras={totalHoras || 1}
              label="Recursos a reservar"
            />

            {/* Fecha y hora de inicio (reubicado debajo de recursos) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora de Inicio <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={fechaHoraInicioPrevista}
                onChange={(e) => setFechaHoraInicioPrevista(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Método de pago */}
            <SeleccionMetodoPago onSubmit={handleSubmitReserva} submitLabel="Registrar Reserva" />
          </div>

          {/* Columna derecha: Resumen */}
          <div className="bg-blue-50 rounded-xl p-6 h-fit">
            <TarjetaResumenReserva
              cliente={selectedClient}
              recursos={selectedResources}
              duracionHoras={totalHoras}
              fechaInicio={fechaHoraInicioPrevista}
              promocionAplicada={promoAplicable && {
                idPromocion: promoAplicable.idPromocion,
                nombre: promoAplicable.nombre,
                porcentajeDesc: parseFloat(promoAplicable.porcentajeDesc || promoAplicable.porcentajeDescuento || 0)
              }}
            />
          </div>
        </div>
      </div>
    );
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
            {vistaActual === 'lista' ? (
              <button
                onClick={() => setVistaActual('nueva')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
              </button>
            ) : (
              <button
                onClick={() => setVistaActual('lista')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" /> Ver Reservas
              </button>
            )}
          </div>
        </div>
      </div>

      {renderVista()}
    </div>
  );
};

export default GestionarReservasPage;
