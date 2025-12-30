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
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {reporte.name}
          </button>
        );
      })}
    </div>
  );
}
