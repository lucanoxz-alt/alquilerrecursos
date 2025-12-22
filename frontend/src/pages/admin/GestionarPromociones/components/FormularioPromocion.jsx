import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const FormularioPromocion = ({ promocion, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    porcentajeDesc: '',
    condicionMinima: 1,
    activa: true
  });

  const [loading, setLoading] = useState(false);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (promocion) {
      setFormData({
        nombre: promocion.nombre || '',
        descripcion: promocion.descripcion || '',
        porcentajeDesc: promocion.porcentajeDesc || '',
        condicionMinima: promocion.condicionMinima ?? 1,
        activa: promocion.activa !== undefined ? promocion.activa : true
      });
    }
  }, [promocion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    if (!formData.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }
    
    let porcentaje = parseFloat(formData.porcentajeDesc);
    if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      alert('El porcentaje debe ser un número entre 1 y 100');
      return;
    }
    porcentaje = Math.round(porcentaje * 100) / 100;

    const condicion = parseInt(formData.condicionMinima, 10);
    if (isNaN(condicion) || condicion < 1) {
      alert('La condición mínima debe ser un entero mayor o igual a 1');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        porcentajeDesc: porcentaje,
        condicionMinima: condicion
      });
    } catch (error) {
      // El error se maneja en la función padre
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la Promoción <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Descuento Verano"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Describe los detalles de la promoción"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </div>

      {/* Porcentaje de Descuento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Porcentaje de Descuento (%) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="100"
          step="0.01"
          value={formData.porcentajeDesc}
          onChange={(e) => handleChange('porcentajeDesc', e.target.value)}
          placeholder="Ej: 25"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </div>

      {/* Condición mínima */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condición mínima (ej. cantidad mínima para aplicar)
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={formData.condicionMinima}
          onChange={(e) => handleChange('condicionMinima', e.target.value)}
          placeholder="Ej: 2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </div>

      {/* Estado Activa */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="activa"
          checked={formData.activa}
          onChange={(e) => handleChange('activa', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={loading}
        />
        <label htmlFor="activa" className="ml-2 block text-sm text-gray-900">
          Promoción activa
        </label>
      </div>

      {/* Botones */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : promocion ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
};

export default FormularioPromocion;