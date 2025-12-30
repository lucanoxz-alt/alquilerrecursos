import React from 'react';
import { Navigate } from 'react-router-dom';

// Lee el usuario desde localStorage
const readUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('userData'));
  } catch {
    return null;
  }
};

// Protege rutas según rol
export default function RequireRole({ allowedRoles = [], children }) {

  const user = readUserFromStorage();

  // Si no está logueado → login
  if (!user) return <Navigate to="/login" replace />;

  const rawRole = (user.rol || user.role || '').toString().trim().toUpperCase();
  const roleMap = {
    'JEFE_ZONAL': 'JEFE',
    'JEFE_ZONA': 'JEFE',
    'ADMIN': 'ADMINISTRADOR',
    'ADMINISTRADOR': 'ADMINISTRADOR',
    'EMPLEADO': 'EMPLEADO',
    'VENDEDOR': 'EMPLEADO',
    'JEFE': 'JEFE',
  };
  const role = roleMap[rawRole] || rawRole;

  // Si no se exige rol → permitir
  if (allowedRoles.length === 0) return children;

  // Validar rol
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
