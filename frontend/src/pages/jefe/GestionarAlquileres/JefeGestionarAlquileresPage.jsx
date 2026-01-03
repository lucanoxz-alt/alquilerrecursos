// src/pages/jefe/GestionarAlquileres/JefeGestionarAlquileresPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import BusquedaCliente from './components/BusquedaCliente';
import FormularioNuevoCliente from './components/FormularioNuevoCliente';
import SeleccionRecursos from './components/SeleccionRecursos';
import SeleccionMetodoPago from './components/SeleccionMetodoPago';
import ListaAlquileresRecientes from './components/ListaAlquileresRecientes';
import TarjetaResumenAlquiler from './components/TarjetaResumenAlquiler';
import api, { promocionService } from '../../../services/api';

const JefeGestionarAlquileresPage = ({ user, modo }) => {
  const [vistaActual, setVistaActual] = useState('lista');
  const [actualizarLista, setActualizarLista] = useState(0);

  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState('');

  const [selectedResources, setSelectedResources] = useState([]);
  const totalHoras = selectedResources.reduce((sum, r) => sum + (parseInt(r.horasSolicitadas, 10) || 0), 0);

  const [promosActivas, setPromosActivas] = useState([]);
  const [promoAplicable, setPromoAplicable] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const promos = await promocionService.obtenerActivas();
        setPromosActivas(Array.isArray(promos) ? promos : []);
      } catch {
        setPromosActivas([]);
      }
    })();
  }, []);

  useEffect(() => {
    // Regla de negocio: la promo depende de horas de alquiler contratadas (duración global), no de cantidad de recursos.
    // Preferimos duracionHoras si existe; si no, usamos totalHoras como respaldo.
    const horasCandidatas = Number.isFinite(Number(totalHoras)) ? Number(totalHoras) : 0;
    const tieneRecursos = Array.isArray(selectedResources) && selectedResources.length > 0;
    if (!Array.isArray(promosActivas) || promosActivas.length === 0 || horasCandidatas <= 0 || !tieneRecursos) {
      setPromoAplicable(null);
      return;
    }
    const elegibles = promosActivas.filter(p => {
      const activa = p.activa !== false;
      const condNum = Number.parseInt((String(p.condicionMinima ?? '').match(/\d+/)?.[0] || '0'), 10);
      const condicionValida = Number.isInteger(condNum) && condNum >= 1;
      return activa && condicionValida && horasCandidatas >= condNum;
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

  const handleSubmitAlquiler = async (metodoPago) => {
    if (!selectedClient) { alert('Por favor selecciona un cliente'); return; }
    if (selectedResources.length === 0) { alert('Por favor selecciona al menos un recurso'); return; }

    try {
      const alquilerData = {
        idTurista: selectedClient.idTurista,
        recursos: selectedResources.map((r) => ({ idRecurso: r.idRecurso, horasSolicitadas: parseInt(r.horasSolicitadas, 10) || 1 })),
        metodoPago,
        idPromocion: promoAplicable?.idPromocion || null,
      };

      const response = await api.post('/alquileres', alquilerData);

      setSelectedClient(null);
      setSelectedResources([]);

      alert('Alquiler registrado exitosamente');

      if (response?.data?.idAlquiler) {
        const id = response.data.idAlquiler;
        const openBlobDownload = (blobData, filename) => {
          const url = URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
          const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        };
        try {
          let blobResp;
            if (response?.data?.pago?.idPago) {
              blobResp = await api.get(`/comprobantes-electronicos/pago/${response.data.pago.idPago}/ticket?tipo=alquiler`, { responseType: 'blob' });
            } else {
              blobResp = await api.get(`/alquileres/${id}/ticket`, { responseType: 'blob' });
            }
            const { data } = blobResp;
          openBlobDownload(data, `TICKET_${id}.pdf`);
        } catch (err) {
          try {
            const { data } = await api.get(`/boletas/${id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `BOLETA_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
          } catch (err3) {
            console.error('Error descargando comprobante', err, err3);
          }
        }
      }

      setActualizarLista((prev) => prev + 1);
      setVistaActual('lista');
    } catch (error) {
      const serverMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
      alert('Error al registrar el alquiler: ' + serverMsg);
    }
  };

  const renderVista = () => {
    if (vistaActual === 'lista') {
      return <ListaAlquileresRecientes actualizarLista={actualizarLista} modo={modo} />;
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

            <SeleccionRecursos
              label="Seleccionar recursos"
              selectedResources={selectedResources}
              onResourcesChange={setSelectedResources}
              fechaInicio={null}
              duracionHoras={totalHoras || 1}
            />

            <SeleccionMetodoPago onSubmit={handleSubmitAlquiler} modo={modo} />
          </div>

          <div className="bg-blue-50 rounded-xl p-6 h-fit">
            <TarjetaResumenAlquiler
              cliente={selectedClient}
              recursos={selectedResources}
              duracionHoras={totalHoras}
              fechaInicio={null}
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
            <h1 className="text-3xl font-bold text-gray-900">Gestionar Alquileres</h1>
            <p className="text-gray-600 mt-2">Registra nuevos alquileres de recursos turísticos.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {vistaActual === 'lista' ? (
              <button onClick={() => setVistaActual('nuevo')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Alquiler
              </button>
            ) : (
              <button onClick={() => setVistaActual('lista')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
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

export default JefeGestionarAlquileresPage;
