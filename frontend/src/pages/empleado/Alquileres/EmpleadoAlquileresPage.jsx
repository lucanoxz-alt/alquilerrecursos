// src/pages/empleado/Alquileres/EmpleadoAlquileresPage.jsx
import React from 'react';
import GestionarAlquileresPage from '@/pages/jefe/GestionarAlquileres/JefeGestionarAlquileresPage';

// Wrapper: reutiliza la UI de gestión de alquileres, pero podríamos pasar props para limitar acciones
const EmpleadoAlquileresPage = ({ user }) => {
  return <GestionarAlquileresPage user={user} modo="empleado" />;
};

export default EmpleadoAlquileresPage;