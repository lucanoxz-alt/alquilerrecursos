import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import SeleccionRecursosConValidacion from '@/components/SeleccionRecursosConValidacion';
import api, { reservaService, turistaService, promocionService, getCurrentUserId } from '@/services/api';
import { Calendar, User, Clock, Tag, DollarSign } from 'lucide-react';
import TarjetaResumenReserva from './TarjetaResumenReserva';
import BusquedaCliente from '../../GestionarAlquileres/components/BusquedaCliente';
import FormularioNuevoCliente from '../../GestionarAlquileres/components/FormularioNuevoCliente';
import SeleccionMetodoPago from '../../GestionarAlquileres/components/SeleccionMetodoPago';

const FormularioNuevaReserva = ({ onReservaCreada, onCerrar }) => {
  const [datosReserva, setDatosReserva] = useState({
    idTurista: '',
    fechaHoraInicioPrevista: '',
    idPromocion: ''
  });
  const [duracionHoras, setDuracionHoras] = useState(2);

  const [turistas, setTuristas] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [metodoPago, setMetodoPago] = useState(null);
  const [recursosValidados, setRecursosValidados] = useState({
    recursos: [],
    valida: false,
    detalles: null
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar turistas usando el servicio
      const turistasData = await turistaService.obtenerTodos();
      setTuristas(turistasData || []);

      // Cargar promociones activas usando el servicio
      const promocionesData = await promocionService.obtenerActivas();
      setPromociones(promocionesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos iniciales');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosReserva(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Limpiar error al modificar
  };

  const handleRecursosSeleccionados = (seleccion) => {
    setRecursosValidados(seleccion);
    setError(''); // Limpiar error si hay recursos válidos
  };

  const validarFormulario = () => {
    if (!(clienteSeleccionado?.idTurista || datosReserva.idTurista)) {
      return 'Debe seleccionar un turista';
    }
    if (!datosReserva.fechaHoraInicioPrevista) {
      return 'Debe seleccionar fecha y hora de inicio';
    }
    if (!recursosValidados.valida || recursosValidados.recursos.length === 0) {
      return 'Debe seleccionar recursos disponibles';
    }
    return null;
  };

  const crearReserva = async () => {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const requestData = {
        idTurista: clienteSeleccionado?.idTurista || datosReserva.idTurista,
        fechaHoraInicioPrevista: datosReserva.fechaHoraInicioPrevista,
        idPromocion: datosReserva.idPromocion || null,
        metodoPago: metodoPago || undefined,
        idUsuarioGestor: getCurrentUserId() || undefined,
        recursos: recursosValidados.recursos.map(recurso => ({
          idRecurso: recurso.idRecurso,
          horasSolicitadas: parseInt(recurso.horasSolicitadas, 10) || parseInt(duracionHoras, 10) || 1
        }))
      };

      const reservaCreada = await reservaService.crear(requestData);

      // Descargar comprobante de pago (PDF) del adelanto 50%
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
        console.warn('Reserva creada, pero no se pudo descargar el comprobante automáticamente:', e);
      }
      
      if (onReservaCreada) {
        onReservaCreada(reservaCreada);
      }

      // Limpiar formulario
      setDatosReserva({
        idTurista: '',
        fechaHoraInicioPrevista: '',
        idPromocion: ''
      });
      setRecursosValidados({ recursos: [], valida: false, detalles: null });

    } catch (error) {
      console.error('Error creando reserva:', error);
      setError(error.response?.data?.message || 'Error creando la reserva');
    } finally {
      setEnviando(false);
    }
  };

  const calcularCostoEstimado = () => {
    if (recursosValidados.recursos.length === 0) return 0;

    const costoBase = recursosValidados.recursos.reduce((total, recurso) => {
      const horas = parseInt(recurso.horasSolicitadas, 10) || parseInt(duracionHoras, 10) || 1; // usar horas seleccionadas o duración global
      return total + (parseFloat(recurso.tarifaHora) * horas);
    }, 0);

    // Aplicar descuento de promoción si existe
    if (datosReserva.idPromocion) {
      const promocion = promociones.find(p => p.idPromocion === datosReserva.idPromocion);
      if (promocion) {
        const totalHoras = recursosValidados.recursos.reduce((s, r) => s + (parseInt(r.horasSolicitadas, 10) || parseInt(duracionHoras, 10) || 1), 0);
        if (totalHoras >= promocion.condicionMinima) {
          const descuento = (costoBase * promocion.porcentajeDesc) / 100;
          return costoBase - descuento;
        }
      }
    }

    return costoBase;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Nueva Reserva
          </h2>
          {onCerrar && (
            <Button variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {/* Datos básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Turista *
            </label>
            <BusquedaCliente
              query={busquedaCliente}
              onQueryChange={setBusquedaCliente}
              onClientSelected={(cli) => {
                setClienteSeleccionado(cli);
                setDatosReserva(prev => ({ ...prev, idTurista: cli.idTurista }));
              }}
              onShowNewClientForm={() => setMostrarNuevoCliente(true)}
              selectedClient={clienteSeleccionado}
            />
            { !datosReserva.fechaHoraInicioPrevista && (
              <div className="mt-2 text-sm text-gray-600">
                <strong>Seleccione la fecha y hora de inicio para ver los recursos disponibles en ese momento.</strong>
              </div>
            )}
            {mostrarNuevoCliente && (
              <FormularioNuevoCliente
                onClose={() => setMostrarNuevoCliente(false)}
                onSuccess={(nuevo) => {
                  setClienteSeleccionado(nuevo);
                  setDatosReserva(prev => ({ ...prev, idTurista: nuevo.idTurista }));
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Fecha y Hora de Inicio *
            </label>
            <input
              type="datetime-local"
              name="fechaHoraInicioPrevista"
              value={datosReserva.fechaHoraInicioPrevista}
              onChange={handleInputChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={duracionHoras}
                onChange={(e) => setDuracionHoras(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Promoción (opcional)
            </label>
            <select
              name="idPromocion"
              value={datosReserva.idPromocion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin promoción</option>
              {promociones.map((promocion) => (
                <option key={promocion.idPromocion} value={promocion.idPromocion}>
                  {promocion.nombre} - {promocion.porcentajeDesc}% descuento
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Selección de recursos */}
      {datosReserva.fechaHoraInicioPrevista && (
        <SeleccionRecursosConValidacion
          fechaInicio={datosReserva.fechaHoraInicioPrevista}
          duracionHoras={duracionHoras}
          onRecursosSeleccionados={handleRecursosSeleccionados}
        />
      )}

      {/* Resumen y acciones */}
      {recursosValidados.recursos.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Resumen de Reserva
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Recursos seleccionados:</span>
              <span className="font-medium text-blue-900">{recursosValidados.recursos.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Tiempo de reserva:</span>
              <span className="font-medium text-blue-900">{new Date(datosReserva.fechaHoraInicioPrevista).toLocaleString()} por {duracionHoras} hora(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Costo estimado:</span>
              <span className="font-medium text-blue-900">
                S/. {calcularCostoEstimado().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Adelanto (50%):</span>
              <span className="font-bold text-blue-900">
                S/. {(calcularCostoEstimado() * 0.5).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-700">
              <div><span className="font-medium">Turista:</span> {clienteSeleccionado?.nombres ? `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos || ''}` : (clienteSeleccionado?.idTurista || datosReserva.idTurista || 'No seleccionado')}</div>
              <div className="mt-1"><span className="font-medium">Recursos:</span> {recursosValidados.recursos.map(r => r.nombre).join(', ') || 'Sin seleccionar'}</div>
            </div>
            <SeleccionMetodoPago 
              onSubmit={(metodo) => {
                setMetodoPago(metodo);
                crearReserva();
              }}
              disabled={!recursosValidados.valida || enviando}
              submitLabel=\"Registrar Reserva\"
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDatosReserva({
                    idTurista: '',
                    fechaHoraInicioPrevista: '',
                    idPromocion: ''
                  });
                  setRecursosValidados({ recursos: [], valida: false, detalles: null });
                  setClienteSeleccionado(null);
                  setBusquedaCliente('');
                  setError('');
                }}
              >
                Limpiar Todo
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FormularioNuevaReserva;