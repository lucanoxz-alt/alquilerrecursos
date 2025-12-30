import React from 'react';
import { Card } from '@/components/ui';

export default function CajaDiariaSection({ data }) {
  const d = data || {};
  const totAlq = d.totalesPorMedioAlquiler || {};
  const totRes = d.totalesPorMedioReservas || {};
  const detalle = Array.isArray(d.detalleOperaciones) ? d.detalleOperaciones : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Efectivo recibido</div>
          <div className="text-3xl font-bold">S/. {Number(d.totalEfectivoRecibido || 0).toFixed(2)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Vueltos</div>
          <div className="text-3xl font-bold">S/. {Number(d.totalVueltoEfectivo || 0).toFixed(2)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Efectivo neto en caja</div>
          <div className="text-3xl font-bold">S/. {Number(d.efectivoNetoEnCaja || 0).toFixed(2)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Totales por medio (Alquileres)</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(totAlq).map(([medio, monto]) => (
              <div key={medio} className="flex justify-between">
                <span className="capitalize">{medio.toLowerCase()}</span>
                <span className="font-medium">S/. {Number(monto || 0).toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(totAlq).length === 0 && (
              <div className="text-gray-500">Sin datos</div>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Totales por medio (Reservas)</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(totRes).map(([medio, monto]) => (
              <div key={medio} className="flex justify-between">
                <span className="capitalize">{medio.toLowerCase()}</span>
                <span className="font-medium">S/. {Number(monto || 0).toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(totRes).length === 0 && (
              <div className="text-gray-500">Sin datos</div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 overflow-auto">
        <h4 className="text-lg font-semibold mb-4">Operaciones del día</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">Gestor</th>
              <th className="py-2 pr-3">Método</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Pagado</th>
              <th className="py-2 pr-3">Vuelto</th>
              <th className="py-2 pr-3">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody>
            {detalle.map((op, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-3">{op.tipo}</td>
                <td className="py-2 pr-3">{op.id}</td>
                <td className="py-2 pr-3">{op.gestor || '-'}</td>
                <td className="py-2 pr-3">{op.metodoPago}</td>
                <td className="py-2 pr-3">S/. {Number(op.total || 0).toFixed(2)}</td>
                <td className="py-2 pr-3">S/. {Number(op.pagado || 0).toFixed(2)}</td>
                <td className="py-2 pr-3">S/. {Number(op.vuelto || 0).toFixed(2)}</td>
                <td className="py-2 pr-3">{op.fechaHora}</td>
              </tr>
            ))}
            {detalle.length === 0 && (
              <tr><td colSpan="8" className="py-3 text-gray-500 text-center">Sin operaciones</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
