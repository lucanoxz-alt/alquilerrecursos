import React, { useState } from 'react';
import api from './services/api';

/*
  HOOK PERSONALIZADO
  - Permite reutilizar la lógica de disponibilidad
  - Puede usarse en cualquier componente
*/
export const useDisponibilidad = () => {

  // Estado que guarda el resultado
  const [resultado, setResultado] = useState(null);

  // Estado de carga
  const [loading, setLoading] = useState(false);

  // Estado de error
  const [error, setError] = useState(null);

  /*
    Función que consulta al backend
    - recursoId: ID del recurso
    - fechaInicio / fechaFin: rango
  */
  const verificarDisponibilidad = async (
    recursoId,
    fechaInicio,
    fechaFin
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Llamada al backend
      const response = await api.get('/alquileres/disponibilidad', {
        params: {
          recursoId,
          fechaInicio,
          fechaFin
        }
      });

      // Guardamos el resultado
      setResultado(response.data);

      return response.data;

    } catch (err) {
      console.error('Error al verificar disponibilidad:', err);
      setError('No se pudo verificar la disponibilidad');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Lo que expone el hook
  return {
    resultado,
    loading,
    error,
    verificarDisponibilidad
  };
};

/*
  COMPONENTE VISUAL
  - Usa el hook
  - Muestra el estado al usuario
*/
const DisponibilidadChecker = ({
  recursoId,
  fechaInicio,
  fechaFin
}) => {

  // Usamos el hook personalizado
  const {
    resultado,
    loading,
    error,
    verificarDisponibilidad
  } = useDisponibilidad();

  return (
    <div className="p-4 border rounded-lg">

      {/* BOTÓN PARA VERIFICAR */}
      <button
        onClick={() =>
          verificarDisponibilidad(recursoId, fechaInicio, fechaFin)
        }
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Verificando...' : 'Ver disponibilidad'}
      </button>

      {/* ERROR */}
      {error && (
        <p className="text-red-600 mt-2">
          {error}
        </p>
      )}

      {/* RESULTADO */}
      {resultado && (
        <div className="mt-3">
          {resultado.disponible ? (
            <p className="text-green-600 font-semibold">
              ✅ Recurso disponible
            </p>
          ) : (
            <p className="text-red-600 font-semibold">
              ❌ Recurso NO disponible
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DisponibilidadChecker;