// src/pages/admin/GestionarAlquileres/components/TarjetaResumenAlquiler.jsx
import React from 'react';
import { FileText } from 'lucide-react';

const TarjetaResumenAlquiler = ({ cliente }) => {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" /> Resumen del alquiler
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">S/. 0.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Descuento:</span>
          <span className="font-medium text-green-600">S/. 0.00</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>S/. 0.00</span>
        </div>
      </div>
      <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Registrar Alquiler
      </button>
    </div>
  );
};

export default TarjetaResumenAlquiler;