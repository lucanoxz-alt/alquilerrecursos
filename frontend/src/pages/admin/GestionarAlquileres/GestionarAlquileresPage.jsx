// src/pages/admin/GestionarAlquileresPage.jsx
import React, { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import BusquedaCliente from './components/BusquedaCliente';
import FormularioNuevoCliente from './components/FormularioNuevoCliente';
import SeleccionRecursos from './components/SeleccionRecursos';
import SeleccionMetodoPago from './components/SeleccionMetodoPago';
import ListaAlquileresRecientes from './components/ListaAlquileresRecientes';
import TarjetaResumenAlquiler from './components/TarjetaResumenAlquiler';
import api, { promocionService } from '../../../services/api';

const GestionarAlquileresPage = () => {
  // Vista: 'lista' | 'nuevo'
  const [vistaActual, setVistaActual] = useState('lista');
  const [actualizarLista, setActualizarLista] = useState(0);

  // Cliente
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');

  // Recursos seleccionados (cada recurso puede tener horasSolicitadas)
  const [selectedResources, setSelectedResources] = useState([]);

  // Hora de inicio (se combina con la fecha actual al enviar)
  const getFechaHoraInicioISO = () => {
    // Usar la fecha y hora actual al registrar el alquiler
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
  };

  const handleClientSelected = (client) => {
    setSelectedClient(client);
    setQueryBusqueda('');
    setShowNewClientForm(false);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQueryBusqueda('');
  };

  const totalHoras = selectedResources.reduce(
    (sum, r) => sum + (parseInt(r.horasSolicitadas, 10) || 0),
    0
  );

  const [promosActivas, setPromosActivas] = React.useState([]);
  const [promoAplicable, setPromoAplicable] = React.useState(null);

  React.useEffect(() => {
    // Cargar promociones activas
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
    // Determinar promoción aplicable en base a totalHoras y condicionMinima
    if (!Array.isArray(promosActivas) || promosActivas.length === 0 || totalHoras <= 0) {
      setPromoAplicable(null);
      return;
    }
    const elegibles = promosActivas.filter(p => (p.activa !== false) && (parseInt(p.condicionMinima, 10) || 0) <= totalHoras);
    if (elegibles.length === 0) {
      setPromoAplicable(null);
      return;
    }
    // Escoger la mayor porcentajeDesc
    const mejor = elegibles.reduce((best, p) => {
      const pct = parseFloat(p.porcentajeDesc || p.porcentajeDescuento || 0);
      const bestPct = parseFloat(best?.porcentajeDesc || best?.porcentajeDescuento || 0);
      return pct > bestPct ? p : best;
    }, null);
    setPromoAplicable(mejor);
  }, [promosActivas, totalHoras]);

  const handleSubmitAlquiler = async (metodoPago) => {
    if (!selectedClient) {
      alert('Por favor selecciona un cliente');
      return;
    }

    if (selectedResources.length === 0) {
      alert('Por favor selecciona al menos un recurso');
      return;
    }

    try {
      const alquilerData = {
        idTurista: selectedClient.idTurista,
        recursos: selectedResources.map((r) => ({
          idRecurso: r.idRecurso,
          horasSolicitadas: parseInt(r.horasSolicitadas, 10) || 1,
        })),
        fechaHoraInicio: getFechaHoraInicioISO(),
        metodoPago: metodoPago,
        idPromocion: promoAplicable?.idPromocion || null,
      };

      const response = await api.post('/alquileres', alquilerData);

      // Limpiar formulario después del éxito
      setSelectedClient(null);
      setSelectedResources([]);

      alert('Alquiler registrado exitosamente');
      console.log('Alquiler creado:', response.data);
      if (response?.data?.idAlquiler) {
        try {
          const { data: html } = await api.get(`/boletas/${response.data.idAlquiler}/html`, { responseType: 'text' });
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
          alert('Boleta generada, pero no se pudo abrir automáticamente (¿sesión expirada?). Puedes abrirla desde la tabla con Ver boleta.');
        }
      }
      setActualizarLista((prev) => prev + 1);
      setVistaActual('lista');
    } catch (error) {
      console.error('Error al crear alquiler:', error);
      const serverMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
      alert('Error al registrar el alquiler: ' + serverMsg);
    }
  };

  const renderVista = () => {
    if (vistaActual === 'lista') {
      return <ListaAlquileresRecientes actualizarLista={actualizarLista} />;
    }

    return (
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
                    <strong>Cliente seleccionado:</strong> {selectedClient.nombres}{' '}
                    {selectedClient.apellidos} ({selectedClient.dniPasaporte})
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
            <SeleccionRecursos
              selectedResources={selectedResources}
              onResourcesChange={setSelectedResources}
            />

            {/* Configuración del alquiler eliminada: el tiempo empieza al registrar alquiler */}
            <div className="hidden">
            </div>

            {/* Método de pago */}
            <SeleccionMetodoPago onSubmit={handleSubmitAlquiler} />
          </div>

          {/* Sección derecha: Resumen y acciones */}
          <div className="bg-blue-50 rounded-xl p-6 h-fit">
            <TarjetaResumenAlquiler
              cliente={selectedClient}
              recursos={selectedResources}
              duracionHoras={totalHoras}
              fechaInicio={getFechaHoraInicioISO()}
              promocionAplicada={promoAplicable && {
                idPromocion: promoAplicable.idPromocion,
                nombre: promoAplicable.nombre,
                porcentajeDescuento: parseFloat(promoAplicable.porcentajeDesc || promoAplicable.porcentajeDescuento || 0)
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
            <h1 className="text-3xl font-bold text-gray-900">Gestionar Alquileres</h1>
            <p className="text-gray-600 mt-2">Registra nuevos alquileres de recursos turísticos.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {vistaActual === 'lista' ? (
              <button
                onClick={() => setVistaActual('nuevo')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Nuevo Alquiler
              </button>
            ) : (
              <button
                onClick={() => setVistaActual('lista')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" /> Ver Alquileres
              </button>
            )}
          </div>
        </div>
      </div>

      {renderVista()}
    </div>
  );
};

export default GestionarAlquileresPage;
