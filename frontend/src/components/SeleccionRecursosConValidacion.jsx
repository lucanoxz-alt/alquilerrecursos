import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import DisponibilidadChecker from './DisponibilidadChecker';
import { disponibilidadService } from '../services/api';

const SeleccionRecursosConValidacion = ({ 
  onRecursosSeleccionados, 
  fechaInicio, 
  duracionHoras 
}) => {
  const [recursosDisponibles, setRecursosDisponibles] = useState([]);
  const [recursosSeleccionados, setRecursosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [validacionGlobal, setValidacionGlobal] = useState({
    valida: false,
    mensaje: ''
  });

  // Cargar recursos disponibles cuando cambian los parámetros
  useEffect(() => {
    if (fechaInicio && duracionHoras) {
      cargarRecursosDisponibles();
    }
  }, [fechaInicio, duracionHoras]);

  // Validar selección cuando cambian los recursos seleccionados
  useEffect(() => {
    if (recursosSeleccionados.length > 0 && fechaInicio && duracionHoras) {
      validarSeleccionCompleta();
    }
  }, [recursosSeleccionados, fechaInicio, duracionHoras]);

  const cargarRecursosDisponibles = async () => {
    setCargando(true);
    try {
      const data = await disponibilidadService.obtenerRecursosDisponibles(
        fechaInicio, 
        duracionHoras
      );
      setRecursosDisponibles(data.recursosDisponibles);
    } catch (error) {
      console.error('Error cargando recursos:', error);
      setRecursosDisponibles([]);
    } finally {
      setCargando(false);
    }
  };

  const validarSeleccionCompleta = async () => {
    if (recursosSeleccionados.length === 0) {
      setValidacionGlobal({ valida: false, mensaje: 'No hay recursos seleccionados' });
      return;
    }

    try {
      const idsSeleccionados = recursosSeleccionados.map(r => r.idRecurso);
      const resultado = await disponibilidadService.verificarMultiple(
        idsSeleccionados,
        fechaInicio,
        duracionHoras
      );

      setValidacionGlobal({
        valida: resultado.todosDisponibles,
        mensaje: resultado.todosDisponibles 
          ? 'Todos los recursos están disponibles' 
          : 'Algunos recursos no están disponibles'
      });

      // Notificar al componente padre
      if (onRecursosSeleccionados) {
        onRecursosSeleccionados({
          recursos: recursosSeleccionados,
          valida: resultado.todosDisponibles,
          detalles: resultado
        });
      }
    } catch (error) {
      console.error('Error validando selección:', error);
      setValidacionGlobal({ 
        valida: false, 
        mensaje: 'Error validando disponibilidad' 
      });
    }
  };

  const toggleRecurso = (recurso) => {
    setRecursosSeleccionados(prev => {
      const yaSeleccionado = prev.find(r => r.idRecurso === recurso.idRecurso);
      
      if (yaSeleccionado) {
        // Remover del array
        return prev.filter(r => r.idRecurso !== recurso.idRecurso);
      } else {
        // Agregar al array
        return [...prev, recurso];
      }
    });
  };

  const estaSeleccionado = (recurso) => {
    return recursosSeleccionados.some(r => r.idRecurso === recurso.idRecurso);
  };

  const calcularCostoTotal = () => {
    return recursosSeleccionados.reduce((total, recurso) => {
      return total + (parseFloat(recurso.tarifaHora) * duracionHoras);
    }, 0);
  };

  if (cargando) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando recursos disponibles...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado de validación global */}
      {recursosSeleccionados.length > 0 && (
        <Card className={`p-4 border-2 ${
          validacionGlobal.valida 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {validacionGlobal.valida ? '✅' : '❌'}
            </div>
            <div>
              <h3 className="font-semibold">
                Validación de Selección
              </h3>
              <p className={`text-sm ${
                validacionGlobal.valida ? 'text-green-600' : 'text-red-600'
              }`}>
                {validacionGlobal.mensaje}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recursos disponibles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Recursos Disponibles 
          {fechaInicio && duracionHoras && (
            <span className="text-sm font-normal text-gray-600">
              {` - ${new Date(fechaInicio).toLocaleDateString()} por ${duracionHoras}h`}
            </span>
          )}
        </h3>

        {recursosDisponibles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🚫</div>
            <p>No hay recursos disponibles para el horario seleccionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recursosDisponibles.map((recurso) => {
              const seleccionado = estaSeleccionado(recurso);
              return (
                <div
                  key={recurso.idRecurso}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    seleccionado
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleRecurso(recurso)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {recurso.nombre}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {recurso.descripcion}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Tarifa:</span> 
                          ${recurso.tarifaHora}/hora
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Ubicación:</span> 
                          {recurso.ubicacion}
                        </p>
                        {duracionHoras && (
                          <p className="text-sm font-medium text-blue-600">
                            Total: ${(parseFloat(recurso.tarifaHora) * duracionHoras).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`ml-3 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      seleccionado
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {seleccionado && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Resumen de selección */}
      {recursosSeleccionados.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            Resumen de Selección
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Recursos seleccionados:</span> {recursosSeleccionados.length}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Duración total:</span> {duracionHoras * recursosSeleccionados.length} horas-recurso
            </p>
            {duracionHoras && (
              <p className="text-lg font-semibold text-blue-800">
                <span className="font-medium">Costo total estimado:</span> ${calcularCostoTotal().toFixed(2)}
              </p>
            )}
          </div>

          <div className="mt-3 flex space-x-2">
            <Button
              onClick={() => setRecursosSeleccionados([])}
              variant="outline"
              size="sm"
            >
              Limpiar Selección
            </Button>
            <Button
              onClick={validarSeleccionCompleta}
              variant="primary"
              size="sm"
              disabled={!validacionGlobal.valida}
            >
              Revalidar Disponibilidad
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SeleccionRecursosConValidacion;