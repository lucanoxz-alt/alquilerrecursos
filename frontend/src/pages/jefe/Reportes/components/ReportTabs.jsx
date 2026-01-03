import React from 'react';

export default function ReportTabs({ options, activeId, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((reporte) => {
        const Icon = reporte.icono;
        const isActive = activeId === reporte.id;
        return (
          <button
            key={reporte.id}
            onClick={() => onSelect(reporte.id)}
            className={`flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="mr-2 h-4 w-4" />
            {reporte.name}
          </button>
        );
      })}
    </div>
  );
}
