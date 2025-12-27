// src/pages/admin/GestionarReservas/components/TarjetaResumenReserva.jsx
import React, { useMemo } from 'react';
import { FileText, User, Package, Clock, Calculator, AlertCircle, CheckCircle, Percent } from 'lucide-react';

const TarjetaResumenReserva = ({ 
  cliente, 
  recursos = [], 
  duracionHoras = 0, 
  fechaInicio,
  promocionAplicada = null 
}) => {
  const calculos = useMemo(() => {
    if (!recursos.length) {
      return { subtotal: 0, total: 0, descuentoCalculado: 0, totalHoras: 0, detalleRecursos: [] };
    }
    const detalleRecursos = recursos.map(r => {
      const tarifa = parseFloat(r.tarifaHora || 0);
      const horas = parseInt(duracionHoras, 10) || 1;
      const subtotalRecurso = tarifa * horas;
      return { ...r, tarifa, horas, subtotalRecurso };
    });
    const subtotal = detalleRecursos.reduce((s, it) => s + it.subtotalRecurso, 0);
    const totalHoras = detalleRecursos.reduce((s, it) => s + it.horas, 0);
    const descuentoCalculado = promocionAplicada ? (subtotal * ((parseFloat(promocionAplicada.porcentajeDesc || promocionAplicada.porcentajeDescuento || 0)) / 100)) : 0;
    const total = subtotal - descuentoCalculado;
    const adelanto = total * 0.5;
    return { subtotal, total, descuentoCalculado, adelanto, totalHoras, detalleRecursos };
  }, [recursos, duracionHoras, promocionAplicada]);

  const formularioCompleto = cliente && recursos.length > 0 && duracionHoras > 0;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center">
        <FileText className="w-5 h-5 mr-2" /> Resumen de la reserva
      </h3>

      {/* Cliente */}
      <div className={`p-3 rounded-lg border ${cliente ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`flex items-center mb-1 ${cliente ? 'text-green-800' : 'text-gray-500'}`}>
          <User className="w-4 h-4 mr-2" />
          <span className="font-medium">Turista</span>
          {cliente && <CheckCircle className="w-4 h-4 ml-auto text-green-600" />}
        </div>
        {cliente ? (
          <>
            <div className="text-sm text-green-700 font-medium">
              {cliente.nombres} {cliente.apellidos}
            </div>
            <div className="text-xs text-green-600">{cliente.dniPasaporte}</div>
          </>
        ) : (
          <div className="text-sm text-gray-500">Selecciona un turista</div>
        )}
      </div>

      {/* Recursos */}
      <div className={`p-3 rounded-lg border ${recursos.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`flex items-center mb-2 ${recursos.length > 0 ? 'text-blue-800' : 'text-gray-500'}`}>
          <Package className="w-4 h-4 mr-2" />
          <span className="font-medium">Recursos {recursos.length > 0 && `(${recursos.length})`}</span>
          {recursos.length > 0 && <CheckCircle className="w-4 h-4 ml-auto text-blue-600" />}
        </div>
        {recursos.length > 0 ? (
          <div className="space-y-2">
            {calculos.detalleRecursos.map((recurso) => (
              <div key={recurso.idRecurso} className="bg-white p-2 rounded border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{recurso.nombre}</div>
                    {recurso.ubicacion && (
                      <div className="text-xs text-gray-500">📍 {recurso.ubicacion}</div>
                    )}
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-medium text-blue-700">
                      S/. {recurso.subtotalRecurso.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">S/. {recurso.tarifa.toFixed(2)}/h • {recurso.horas} h</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Selecciona recursos</div>
        )}
      </div>

      {/* Duración y fecha */}
      <div className={`p-3 rounded-lg border ${duracionHoras > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`flex items-center mb-2 ${duracionHoras > 0 ? 'text-orange-800' : 'text-gray-500'}`}>
          <Clock className="w-4 h-4 mr-2" />
          <span className="font-medium">Tiempo de reserva</span>
          {duracionHoras > 0 && <CheckCircle className="w-4 h-4 ml-auto text-orange-600" />}
        </div>
        {duracionHoras > 0 ? (
          <div className="space-y-1">
            <div className="text-sm text-orange-700 font-medium">{duracionHoras} hora{duracionHoras > 1 ? 's' : ''}</div>
            {fechaInicio && (
              <div className="text-xs text-orange-600">Inicio: {new Date(fechaInicio).toLocaleString()}</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Define la duración</div>
        )}
      </div>

      {/* Promoción aplicada */}
      {promocionAplicada && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center text-purple-800 mb-1">
            <Percent className="w-4 h-4 mr-2" />
            <span className="font-medium">Promoción aplicada</span>
          </div>
          <div className="text-sm text-purple-700">
            {promocionAplicada.nombre} - {parseFloat(promocionAplicada.porcentajeDesc || promocionAplicada.porcentajeDescuento || 0)}% de descuento
          </div>
        </div>
      )}

      {/* Totales */}
      {recursos.length > 0 && duracionHoras > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center mb-3 text-gray-800">
            <Calculator className="w-4 h-4 mr-2" />
            <span className="font-medium">Cálculo de la reserva</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">S/. {calculos.subtotal.toFixed(2)}</span>
            </div>
            {calculos.descuentoCalculado > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-medium text-green-600">- S/. {calculos.descuentoCalculado.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-blue-700">S/. {calculos.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Adelanto (50%):</span>
              <span className="font-bold text-blue-900">S/. {calculos.adelanto.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Estado */}
      <div className="space-y-2">
        {!formularioCompleto && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800 mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Información requerida</span>
            </div>
            <div className="space-y-1 text-xs">
              {!cliente && <div className="text-yellow-700">• Selecciona un turista</div>}
              {recursos.length === 0 && <div className="text-yellow-700">• Selecciona al menos un recurso</div>}
              {duracionHoras <= 0 && <div className="text-yellow-700">• Define la duración</div>}
            </div>
          </div>
        )}
        {formularioCompleto && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-medium text-sm">Listo para registrar la reserva</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TarjetaResumenReserva;
