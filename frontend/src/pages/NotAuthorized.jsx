// src/pages/NotAuthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
      <h2 className="text-2xl font-semibold mb-4">No Autorizado</h2>
      <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta página.</p>
      <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Volver al inicio</Link>
    </div>
  </div>
);

export default NotAuthorized;