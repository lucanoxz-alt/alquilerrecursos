// src/pages/jefe/GestionarReservas/JefeGestionarReservasPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import BusquedaCliente from '../GestionarAlquileres/components/BusquedaCliente';
import FormularioNuevoCliente from '../GestionarAlquileres/components/FormularioNuevoCliente';
import SeleccionRecursosReserva from './components/SeleccionRecursosReserva';
import SeleccionMetodoPago from '../GestionarAlquileres/components/SeleccionMetodoPago';
import ListaReservasRecientes from './components/ListaReservasRecientes';
import TarjetaResumenReserva from './components/TarjetaResumenReserva';
import api, { promocionService, reservaService, getCurrentUserId } from '../../../services/api';

const JefeGestionarReservasPage = ({ user, modo }) => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [actualizarLista, setActualizarLista] = useState(0);

  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');

  const [fechaHoraInicio, setFechaHoraInicio] = useState('');

  const [selectedResources, setSelectedResources] = useState([]);

  const totalHoras = selectedResources.reduce(
    (sum, r) => sum + (parseInt(r.horasSolicitadas, 10) || 0),
    0
  );

  const [promosActivas, setPromosActivas] = useState([]);
  const [promoAplicable, setPromoAplicable] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const promos = await promocionService.obtenerActivas();
        setPromosActivas(Array.isArray(promos) ? promos : []);
      } catch (e) {
        setPromosActivas([]);
      }
    })();
  }, []);

  useEffect(() => {
    const totalHorasInt = Number.isFinite(Number(totalHoras)) ? Number(totalHoras) : 0;
    if (!Array.isArray(promosActivas) || promosActivas.length === 0 || totalHorasInt <= 0 || !selectedResources || selectedResources.length === 0) {
      setPromoAplicable(null);
      return;
    }
    const elegibles = promosActivas.filter(p => {
      const activa = p.activa !== false;
      const condRaw = p.condicionMinima;
      const cond = Number.parseInt((String(condRaw).match(/\d+/)?.[0] || '0'), 10);
      const condicionValida = Number.isInteger(cond) && cond >= 1;
      return activa && condicionValida && totalHorasInt >= cond;
    });
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
  }, [promosActivas, totalHoras, selectedResources]);

  const handleClientSelected = (client) => {
    setSelectedClient(client);
    setQueryBusqueda('');
    setShowNewClientForm(false);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQueryBusqueda('');
  };

  const handleSubmitReserva = async (metodoPago) => {
    if (!selectedClient) { alert('Por favor selecciona un cliente'); return; }
    if (!fechaHoraInicio) { alert('Por favor selecciona fecha y hora de inicio'); return; }
    if (selectedResources.length === 0) { alert('Por favor selecciona al menos un recurso'); return; }

    try {
      // Validación de disponibilidad múltiple justo antes de crear (evita condiciones de carrera)
      try {
        const ids = selectedResources.map(r => r.idRecurso);
        const duracion = selectedResources.reduce((s, r) => s + (parseInt(r.horasSolicitadas, 10) || 1), 0) || 1;
        const multi = await (await import('../../../services/api')).disponibilidadService.verificarMultiple(ids, fechaHoraInicio, duracion);
        if (!multi?.todosDisponibles) {
          const detalles = multi?.detallesPorRecurso || {};
          const primero = Object.entries(detalles).find(([, msg]) => (msg||'').toLowerCase() !== 'disponible');
          const msj = primero ? `${primero[0]}: ${primero[1]}` : 'Uno o más recursos no están disponibles en ese horario.';
          alert('La disponibilidad cambió: ' + msj);
          return;
        }
      } catch (e) {
        console.warn('No se pudo validar disponibilidad múltiple justo antes de crear', e);
      }

      const reservaData = {
        idTurista: selectedClient.idTurista,
        fechaHoraInicioPrevista: fechaHoraInicio,
        recursos: selectedResources.map((r) => ({
          idRecurso: r.idRecurso,
          horasSolicitadas: parseInt(r.horasSolicitadas, 10) || 1,
        })),
        metodoPago: metodoPago,
        idPromocion: promoAplicable?.idPromocion || null,
        idUsuarioGestor: getCurrentUserId() || undefined,
      };

      const reserva = await reservaService.crear(reservaData);

      setSelectedClient(null);
      setFechaHoraInicio('');
      setSelectedResources([]);

      alert('Reserva registrada exitosamente');

      try {
        const { data } = await api.get(`/comprobantes-pago-reserva/reserva/${reserva.idReserva}/pdf`, { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante_reserva_${reserva.idReserva}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (e) {
        alert('Reserva creada, pero no se pudo descargar el comprobante automáticamente (¿sesión expirada?). Puedes generarlo desde la lista de reservas.');
      }

      setActualizarLista((prev) => prev + 1);
      setVistaActual('lista');
    } catch (error) {
      const serverMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
      alert('Error al registrar la reserva: ' + serverMsg);
    }
  };

  const renderVista = () => {
    if (vistaActual === 'lista') {
      return <ListaReservasRecientes actualizarLista={actualizarLista} modo={modo} />;
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                  <button onClick={handleClearClient} className="text-green-700 hover:text-green-900" title="Quitar cliente">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {showNewClientForm && (
              <FormularioNuevoCliente onClose={() => setShowNewClientForm(false)} onSuccess={handleClientSelected} />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y Hora de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={fechaHoraInicio}
                onChange={(e) => setFechaHoraInicio(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {!fechaHoraInicio && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Seleccione la fecha y hora de inicio para ver los recursos disponibles en la fecha seleccionada.</strong>
                </div>
              )}
            </div>

            {fechaHoraInicio && (
              <SeleccionRecursosReserva
                selectedResources={selectedResources}
                fechaInicio={fechaHoraInicio}
                duracionHoras={totalHoras || 1}
                onResourcesChange={(recursos) => setSelectedResources(Array.isArray(recursos) ? recursos : [])}
              />
            )}

            <SeleccionMetodoPago onSubmit={handleSubmitReserva} modo={modo} submitLabel="Registrar Reserva" />
          </div>

          <div className="bg-blue-50 rounded-xl p-6 h-fit">
            <TarjetaResumenReserva
              cliente={selectedClient}
              recursos={selectedResources}
              duracionHoras={totalHoras}
              fechaInicio={fechaHoraInicio}
              promocionAplicada={promoAplicable && {
                idPromocion: promoAplicable.idPromocion,
                nombre: promoAplicable.nombre,
                porcentajeDescuento: parseFloat(promoAplicable.porcentajeDesc || promoAplicable.porcentajeDescuento || 0),
                condicionMinimaNum: parseInt(String(promoAplicable.condicionMinima ?? '').match(/\d+/)?.[0] || '0', 10)
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
            <p className="text-gray-600 mt-2">Registra nuevas reservas de recursos turísticos.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {vistaActual === 'lista' ? (
              <button onClick={() => setVistaActual('nuevo')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
              </button>
            ) : (
              <button onClick={() => setVistaActual('lista')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
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

export default JefeGestionarReservasPage;
