import React from 'react';

// Íconos desde lucide-react (solo visual, no lógica)
import { Package, DollarSign, Users, MapPin } from 'lucide-react';

/*
  Dashboard:
  - Es una PÁGINA
  - Se renderiza cuando el usuario entra al sistema
  - Muestra estadísticas generales y alquileres recientes
*/
const Dashboard = ({ stats, recentBookings }) => {

  return (
    // Contenedor principal del dashboard
    <div className="flex-1 p-8">

      {/* TÍTULO PRINCIPAL */}
      <h2 className="text-3xl font-bold mb-2">
        Dashboard
      </h2>

      {/* Subtítulo */}
      <p className="text-gray-600 mb-8">
        Bienvenido al Sistema de Gestión
      </p>

      {/* ================= TARJETAS DE ESTADÍSTICAS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        {/* Recorremos el arreglo "stats" */}
        {stats.map((stat, index) => {

          // Variable para guardar el ícono correcto
          let Icon;

          // Elegimos el ícono según el nombre recibido
          switch (stat.icon) {
            case 'Package':
              Icon = Package;
              break;
            case 'DollarSign':
              Icon = DollarSign;
              break;
            case 'Users':
              Icon = Users;
              break;
            case 'MapPin':
              Icon = MapPin;
              break;
            default:
              Icon = () => null; // Si no hay ícono
          }

          return (
            // Tarjeta individual
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow flex justify-between items-center"
            >
              <div>
                {/* Título de la estadística */}
                <p className="text-sm text-gray-600">
                  {stat.title}
                </p>

                {/* Valor principal */}
                <p className="text-2xl font-bold">
                  {stat.value}
                </p>
              </div>

              {/* Ícono */}
              <div className="p-3 bg-black rounded-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= TABLA DE ALQUILERES RECIENTES ================= */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left border-collapse">

          {/* ENCABEZADO */}
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Recurso</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Monto</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>

          {/* CUERPO */}
          <tbody>
            {recentBookings.map((booking, index) => (
              <tr key={index} className="border-t">
                <td className="p-4">{booking.id}</td>
                <td className="p-4">{booking.customer}</td>
                <td className="p-4">{booking.resource}</td>
                <td className="p-4">{booking.date}</td>
                <td className="p-4">{booking.amount}</td>
                <td className="p-4">{booking.status}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Dashboard;