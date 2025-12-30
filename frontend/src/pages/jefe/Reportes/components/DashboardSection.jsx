import React from 'react';
import { Card } from '@/components/ui';
import { Calendar, Package, DollarSign, PieChart, TrendingUp, Users } from 'lucide-react';

export default function DashboardSection({ data, loading }) {
  if (loading || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando dashboard...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Reservas</h3>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.totalReservas}</div>
          <p className="text-sm text-gray-600">Todas las reservas</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Alquileres</h3>
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.totalAlquileres}</div>
          <p className="text-sm text-gray-600">Alquileres completados</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ingresos del Mes</h3>
            <DollarSign className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">S/. {data?.ingresosMesActual?.toFixed(2) || '0.00'}</div>
          <p className="text-sm text-gray-600">Mes actual</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recursos Disponibles</h3>
            <PieChart className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.recursosDisponibles}</div>
          <p className="text-sm text-gray-600">De {data.totalRecursos} totales</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Reservas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.reservasPorEstado || {}).map(([estado, cantidad]) => (
            <div key={estado} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{cantidad}</div>
              <div className="text-sm text-gray-600 capitalize">{estado}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Operativo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-green-800">Alquileres Activos</div>
                <div className="text-2xl font-bold text-green-900">{data.alquileresActivos}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-blue-800">Turistas Registrados</div>
                <div className="text-2xl font-bold text-blue-900">{data.totalTuristas}</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
