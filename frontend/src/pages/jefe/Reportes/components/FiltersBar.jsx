import React from 'react';
import { Button } from '@/components/ui';
import { Filter } from 'lucide-react';

export default function FiltersBar({ show, dateRange, setDateRange, onApply, showGestor = false, gestores = [], gestorId = '', setGestorId = () => {} }) {
  if (!show) return null;
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {showGestor && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gestor (usuario)</label>
          <select
            value={gestorId}
            onChange={(e) => setGestorId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-[220px]"
          >
            <option value="">Todos</option>
            {gestores.map((g) => (
              <option key={g.idUsuario} value={g.idUsuario}>{g.username} - {g.nombre} {g.apellidos}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-end">
        <Button onClick={onApply} className="flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
