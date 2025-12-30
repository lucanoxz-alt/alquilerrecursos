// src/pages/empleado/Promociones/EmpleadoPromocionesPage.jsx
import React from 'react';
import GestionarPromocionesPage from '@/pages/jefe/GestionarPromociones/JefeGestionarPromocionesPage';

// Solo lectura para empleado
export default function EmpleadoPromocionesPage({ user }) {
  return <GestionarPromocionesPage user={user} modo="empleado" />;
}
