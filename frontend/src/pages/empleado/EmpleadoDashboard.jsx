// src/pages/empleado/EmpleadoDashboard.jsx
import React from 'react';

const EmpleadoDashboard = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Panel de Empleado</h2>
      <p className="mt-4 text-sm text-gray-600">Bienvenido, {user?.nombre || user?.username || 'Empleado'}. Aquí verás las funcionalidades mínimas asignadas a tu rol.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Resumen de caja diaria</h3>
          <p className="text-sm text-gray-500">Accede a tu resumen diario desde Reportes → Diario (solo tu información).</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Alquileres y reservas</h3>
          <p className="text-sm text-gray-500">Gestiona alquileres y reservas asignadas.</p>
        </div>
      </div>
    </div>
  );
};

export default EmpleadoDashboard;