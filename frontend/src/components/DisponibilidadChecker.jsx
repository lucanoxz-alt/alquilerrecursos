import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { disponibilidadService } from '@/services/api';

const DisponibilidadChecker = ({ 
  recursoSeleccionado, 
  fechaInicio, 
  duracionHoras, 
  onDisponibilidadChange 
}) => {
  const [estado, setEstado] = useState('idle'); // idle, checking, disponible, no-disponible
  const [mensaje, setMensaje] = useState('');
  const [recursosDisponibles, setRecursosDisponibles] = useState([]);

  // Verificar disponibilidad cuando cambien los parámetros
  useEffect(() => {
    if (fechaInicio && duracionHoras) {
      verificarDisponibilidad();
    }
  }, [fechaInicio, duracionHoras, recursoSeleccionado]);

  const verificarDisponibilidad = async () => {
    if (!fechaInicio || !duracionHoras) return;
    
    setEstado('checking');
    
    try {
      if (recursoSeleccionado) {
        // Verificar un recurso específico
        const data = await disponibilidadService.verificarRecurso(
          recursoSeleccionado, 
          fechaInicio, 
          duracionHoras
        );
        
        if (data.disponible) {
          setEstado('disponible');
          setMensaje('✅ Recurso disponible');
        } else {
          setEstado('no-disponible');
          setMensaje(`❌ ${data.detalle}`);
        }
        
        if (onDisponibilidadChange) {
          onDisponibilidadChange(data.disponible, data.detalle);
        }
      } else {
        // Obtener todos los recursos disponibles
        const data = await disponibilidadService.obtenerRecursosDisponibles(
          fechaInicio, 
          duracionHoras
        );
        
        setRecursosDisponibles(data.recursosDisponibles);
        setEstado('disponible');
        setMensaje(`📊 ${data.totalDisponibles} recursos disponibles`);
        
        if (onDisponibilidadChange) {
          onDisponibilidadChange(true, data);
        }
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      setEstado('no-disponible');
      setMensaje('❌ Error verificando disponibilidad');
      
      if (onDisponibilidadChange) {
        onDisponibilidadChange(false, 'Error de conexión');
      }
    }
  };

  const verificarMultiplesRecursos = async (idsRecursos) => {
    if (!fechaInicio || !duracionHoras || !idsRecursos?.length) return;
    
    setEstado('checking');
    
    try {
      const response = await fetch('/api/disponibilidad/verificar-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idsRecursos,
          fechaInicio,
          duracionHoras
        })
      });
      
      const data = await response.json();
      
      if (data.todosDisponibles) {
        setEstado('disponible');
        setMensaje('✅ Todos los recursos están disponibles');
      } else {
        setEstado('no-disponible');
        const conflictos = Object.entries(data.detallesPorRecurso)
          .filter(([id, detalle]) => detalle !== 'Disponible')
          .map(([id, detalle]) => `${id}: ${detalle}`)
          .join(', ');
        setMensaje(`❌ Conflictos: ${conflictos}`);
      }
      
      if (onDisponibilidadChange) {
        onDisponibilidadChange(data.todosDisponibles, data.detallesPorRecurso);
      }
    } catch (error) {
      console.error('Error verificando disponibilidad múltiple:', error);
      setEstado('no-disponible');
      setMensaje('❌ Error verificando disponibilidad');
    }
  };

  const getEstadoColor = () => {
    switch (estado) {
      case 'checking': return 'text-blue-600';
      case 'disponible': return 'text-green-600';
      case 'no-disponible': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getIcono = () => {
    switch (estado) {
      case 'checking': return '🔄';
      case 'disponible': return '✅';
      case 'no-disponible': return '❌';
      default: return '📅';
    }
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{getIcono()}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            Estado de Disponibilidad
          </h3>
          <p className={`text-sm ${getEstadoColor()}`}>
            {estado === 'checking' ? 'Verificando disponibilidad...' : mensaje}
          </p>
        </div>
        {estado === 'checking' && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        )}
      </div>
      
      {/* Lista de recursos disponibles */}
      {recursosDisponibles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">
            Recursos Disponibles:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recursosDisponibles.map((recurso) => (
              <div 
                key={recurso.idRecurso} 
                className="bg-green-50 border border-green-200 rounded p-2"
              >
                <div className="font-medium text-green-800">
                  {recurso.nombre}
                </div>
                <div className="text-sm text-green-600">
                  ${recurso.tarifaHora}/hora - {recurso.ubicacion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Hook personalizado para usar el checker de disponibilidad
export const useDisponibilidad = () => {
  const [disponibilidad, setDisponibilidad] = useState({
    disponible: false,
    mensaje: '',
    detalles: null
  });

  const verificarRecurso = async (idRecurso, fechaInicio, duracionHoras) => {
    try {
      const data = await disponibilidadService.verificarRecurso(
        idRecurso, 
        fechaInicio, 
        duracionHoras
      );
      
      setDisponibilidad({
        disponible: data.disponible,
        mensaje: data.detalle,
        detalles: data
      });
      
      return data;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      setDisponibilidad({
        disponible: false,
        mensaje: 'Error de conexión',
        detalles: null
      });
      throw error;
    }
  };

  const verificarMultiples = async (idsRecursos, fechaInicio, duracionHoras) => {
    try {
      const data = await disponibilidadService.verificarMultiple(
        idsRecursos,
        fechaInicio,
        duracionHoras
      );
      
      setDisponibilidad({
        disponible: data.todosDisponibles,
        mensaje: data.todosDisponibles ? 'Todos disponibles' : 'Hay conflictos',
        detalles: data
      });
      
      return data;
    } catch (error) {
      console.error('Error verificando disponibilidad múltiple:', error);
      throw error;
    }
  };

  return {
    disponibilidad,
    verificarRecurso,
    verificarMultiples
  };
};

export default DisponibilidadChecker;