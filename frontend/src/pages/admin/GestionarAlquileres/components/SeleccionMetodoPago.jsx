// src/pages/admin/GestionarAlquileres/components/SeleccionMetodoPago.jsx
import React, { useState } from 'react';

const SeleccionMetodoPago = ({ onSubmit, disabled = false }) => {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);

  const metodosPago = ['Efectivo', 'Yape', 'Tarjeta', 'Transferencia'];

  const handleSubmit = () => {
    if (!metodoSeleccionado) {
      alert('Por favor selecciona un método de pago');
      return;
    }
    onSubmit(metodoSeleccionado);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Método de pago <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {metodosPago.map((metodo) => (
          <button
            key={metodo}
            type="button"
            onClick={() => setMetodoSeleccionado(metodo)}
            disabled={disabled}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
              metodoSeleccionado === metodo
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {metodo}
          </button>
        ))}
      </div>
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !metodoSeleccionado}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Registrar Alquiler
      </button>
    </div>
  );
};

export default SeleccionMetodoPago;