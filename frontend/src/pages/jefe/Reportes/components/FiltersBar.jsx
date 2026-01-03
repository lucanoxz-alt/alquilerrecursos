import React from 'react';
import { Button } from '@/components/ui';
import { Filter } from 'lucide-react';

export default function FiltersBar({ show, dateRange, setDateRange, onApply, showGestor = false, gestores = [], gestorId = '', setGestorId = () => {}, showTuristaRecurso = false, idTurista = '', setIdTurista = () => {}, idRecurso = '', setIdRecurso = () => {} }) {
  if (!show) return null;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
      <div className="flex items-center space-x-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fecha Inicio</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fecha Fin</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showGestor && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Gestor (usuario)</label>
          <select
            value={gestorId}
            onChange={(e) => setGestorId(e.target.value)}
            className="min-w-[220px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {gestores.map((g) => (
              <option key={g.idUsuario} value={g.idUsuario}>{g.username} - {g.nombre} {g.apellidos}</option>
            ))}
          </select>
        </div>
      )}

      {showTuristaRecurso && (
        <div className="flex items-center space-x-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ID Turista</label>
            <input
              type="text"
              value={idTurista}
              onChange={(e) => setIdTurista(e.target.value)}
              placeholder="Opcional"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ID Recurso</label>
            <input
              type="text"
              value={idRecurso}
              onChange={(e) => setIdRecurso(e.target.value)}
              placeholder="Opcional"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="flex items-end">
        <Button onClick={onApply} className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
