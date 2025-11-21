import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Clock, Users } from 'lucide-react';
import api from '../../../../services/api';

const SeleccionRecursosMejorado = ({ selectedResources, onResourcesChange }) => {
  const [recursos, setRecursos] = useState([]);
  const [recursosAgrupados, setRecursosAgrupados] = useState({});
  const [loadingResources, setLoadingResources] = useState(false);
  const [seleccionesDetalladas, setSeleccionesDetalladas] = useState({});

  useEffect(() => {
    cargarRecursos();
  }, []);

  const cargarRecursos = async () => {
    setLoadingResources(true);
    try {
      const response = await api.get('/recursos/disponibles');
      setRecursos(response.data);
      agruparRecursos(response.data);
    } catch (error) {
      console.error('Error al cargar recursos:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const agruparRecursos = (listaRecursos) => {
    const agrupados = listaRecursos.reduce((acc, recurso) => {
      const clave = `${recurso.nombre}-${recurso.tarifaHora}`;
      if (!acc[clave]) {
        acc[clave] = {
          nombre: recurso.nombre,
          descripcion: recurso.descripcion,
          tarifaHora: recurso.tarifaHora,
          ubicacion: recurso.ubicacion,
          unidades: [],
          totalDisponibles: 0
        };
      }
      acc[clave].unidades.push(recurso);
      acc[clave].totalDisponibles++;
      return acc;
    }, {});
    
    setRecursosAgrupados(agrupados);
  };

  const actualizarCantidadSeleccionada = (claveGrupo, nuevaCantidad) => {
    const grupo = recursosAgrupados[claveGrupo];
    if (nuevaCantidad > grupo.totalDisponibles) return;

    const nuevasSelecciones = { ...seleccionesDetalladas };
    
    if (nuevaCantidad === 0) {
      delete nuevasSelecciones[claveGrupo];
    } else {
      if (!nuevasSelecciones[claveGrupo]) {
        nuevasSelecciones[claveGrupo] = {
          cantidad: nuevaCantidad,
          horasPorUnidad: Array(nuevaCantidad).fill(1)
        };
      } else {
        const horasActuales = nuevasSelecciones[claveGrupo].horasPorUnidad;
        nuevasSelecciones[claveGrupo] = {
          cantidad: nuevaCantidad,
          horasPorUnidad: nuevaCantidad > horasActuales.length
            ? [...horasActuales, ...Array(nuevaCantidad - horasActuales.length).fill(1)]
            : horasActuales.slice(0, nuevaCantidad)
        };
      }
    }
    
    setSeleccionesDetalladas(nuevasSelecciones);
    actualizarRecursosSeleccionados(nuevasSelecciones);
  };

  const actualizarHorasUnidad = (claveGrupo, indiceUnidad, horas) => {
    const nuevasSelecciones = { ...seleccionesDetalladas };
    if (nuevasSelecciones[claveGrupo]) {
      nuevasSelecciones[claveGrupo].horasPorUnidad[indiceUnidad] = parseInt(horas) || 1;
      setSeleccionesDetalladas(nuevasSelecciones);
      actualizarRecursosSeleccionados(nuevasSelecciones);
    }
  };

  const actualizarRecursosSeleccionados = (selecciones) => {
    const recursosSeleccionados = [];
    
    Object.entries(selecciones).forEach(([claveGrupo, seleccion]) => {
      const grupo = recursosAgrupados[claveGrupo];
      if (grupo) {
        for (let i = 0; i < seleccion.cantidad; i++) {
          if (grupo.unidades[i]) {
            recursosSeleccionados.push({
              ...grupo.unidades[i],
              horasSolicitadas: seleccion.horasPorUnidad[i],
              costoCalculado: parseFloat(grupo.tarifaHora) * seleccion.horasPorUnidad[i]
            });
          }
        }
      }
    });

    onResourcesChange(recursosSeleccionados);
  };

  const calcularTotalPorGrupo = (claveGrupo) => {
    const seleccion = seleccionesDetalladas[claveGrupo];
    const grupo = recursosAgrupados[claveGrupo];
    
    if (!seleccion || !grupo) return 0;
    
    return seleccion.horasPorUnidad.reduce(
      (total, horas) => total + (parseFloat(grupo.tarifaHora) * horas), 
      0
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <label className="block text-lg font-medium text-gray-900">
          Selección de Recursos <span className="text-red-500">*</span>
        </label>
        <div className="text-sm text-gray-500">
          {Object.keys(seleccionesDetalladas).length} tipo(s) seleccionado(s)
        </div>
      </div>
      
      {loadingResources ? (
        <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            Cargando inventario de recursos...
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(recursosAgrupados).map(([claveGrupo, grupo]) => {
            const seleccion = seleccionesDetalladas[claveGrupo];
            const cantidadSeleccionada = seleccion ? seleccion.cantidad : 0;
            
            return (
              <div
                key={claveGrupo}
                className={`border rounded-lg transition-all duration-200 ${
                  cantidadSeleccionada > 0 
                    ? 'border-blue-300 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Encabezado del grupo */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        cantidadSeleccionada > 0 ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Package className={`h-5 w-5 ${
                          cantidadSeleccionada > 0 ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{grupo.nombre}</h3>
                        {grupo.descripcion && (
                          <p className="text-sm text-gray-600">{grupo.descripcion}</p>
                        )}
                        {grupo.ubicacion && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            📍 {grupo.ubicacion}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-lg">
                        S/. {parseFloat(grupo.tarifaHora).toFixed(2)}/hora
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {grupo.totalDisponibles} disponibles
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control de cantidad */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Cantidad a alquilar:
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => actualizarCantidadSeleccionada(claveGrupo, Math.max(0, cantidadSeleccionada - 1))}
                        disabled={cantidadSeleccionada === 0}
                        className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <input
                        type="number"
                        min="0"
                        max={grupo.totalDisponibles}
                        value={cantidadSeleccionada}
                        onChange={(e) => actualizarCantidadSeleccionada(claveGrupo, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-gray-300 rounded-md py-1"
                      />
                      
                      <button
                        type="button"
                        onClick={() => actualizarCantidadSeleccionada(claveGrupo, Math.min(grupo.totalDisponibles, cantidadSeleccionada + 1))}
                        disabled={cantidadSeleccionada >= grupo.totalDisponibles}
                        className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Configuración de horas por unidad */}
                  {cantidadSeleccionada > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        Configurar horas por unidad
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {seleccion.horasPorUnidad.map((horas, indice) => (
                          <div key={indice} className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600 w-20">
                              Unidad {indice + 1}:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={horas}
                              onChange={(e) => actualizarHorasUnidad(claveGrupo, indice, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-center"
                            />
                            <span className="text-xs text-gray-500 w-12">
                              horas
                            </span>
                            <span className="text-sm font-medium text-green-600 w-16 text-right">
                              S/. {(parseFloat(grupo.tarifaHora) * horas).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-medium text-gray-900">Subtotal:</span>
                        <span className="font-bold text-green-600 text-lg">
                          S/. {calcularTotalPorGrupo(claveGrupo).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {Object.keys(recursosAgrupados).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay recursos disponibles en el inventario</p>
            </div>
          )}
        </div>
      )}

      {/* Resumen de selección */}
      {Object.keys(seleccionesDetalladas).length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">
            📋 Resumen de Alquiler
          </h4>
          <div className="space-y-2">
            {Object.entries(seleccionesDetalladas).map(([claveGrupo, seleccion]) => {
              const grupo = recursosAgrupados[claveGrupo];
              return (
                <div key={claveGrupo} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    {grupo.nombre} × {seleccion.cantidad} unidades
                    ({seleccion.horasPorUnidad.reduce((a, b) => a + b, 0)} horas total)
                  </span>
                  <span className="font-medium text-green-600">
                    S/. {calcularTotalPorGrupo(claveGrupo).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
            <span className="font-bold text-blue-900">TOTAL:</span>
            <span className="font-bold text-green-600 text-xl">
              S/. {Object.keys(seleccionesDetalladas).reduce(
                (total, clave) => total + calcularTotalPorGrupo(clave), 0
              ).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeleccionRecursosMejorado;