// src/pages/empleado/Reservas/EmpleadoReservasPage.jsx
import React from 'react';
import GestionarReservasPage from '@/pages/admin/GestionarReservas/GestionarReservasPage';

const EmpleadoReservasPage = ({ user }) => {
  return <GestionarReservasPage user={user} modo="empleado" />;
};

export default EmpleadoReservasPage;