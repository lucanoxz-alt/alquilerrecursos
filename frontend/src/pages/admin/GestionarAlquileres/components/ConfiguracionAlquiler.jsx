// src/pages/admin/GestionarAlquileres/components/ConfiguracionAlquiler.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const ConfiguracionAlquiler = ({ 
  fechaInicio, 
  onFechaInicioChange, 
  duracionHoras, 
  onDuracionChange 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha y hora de inicio <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => onFechaInicioChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duración (horas) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="24"
          value={duracionHoras}
          onChange={(e) => onDuracionChange(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default ConfiguracionAlquiler;