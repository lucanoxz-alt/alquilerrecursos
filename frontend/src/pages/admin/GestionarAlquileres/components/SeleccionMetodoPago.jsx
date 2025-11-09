// src/pages/admin/GestionarAlquileres/components/SeleccionMetodoPago.jsx
import React from 'react';

const SeleccionMetodoPago = () => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Método de pago
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {['Efectivo', 'Yape', 'Tarjeta', 'Transferencia'].map((metodo) => (
          <button
            key={metodo}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
          >
            {metodo}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeleccionMetodoPago;