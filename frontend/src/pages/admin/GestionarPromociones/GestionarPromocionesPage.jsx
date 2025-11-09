// src/pages/admin/GestionarPromocionesPage.jsx
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit, Trash2, Calendar, Percent, Info } from 'lucide-react';

const GestionarPromocionesPage = ({ user }) => {
  const [promociones, setPromociones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simular carga de promociones
  useEffect(() => {
    const cargarPromociones = async () => {
      setLoading(true);
      try {
        // Datos simulados – reemplazarás esto con llamada a tu API
        const data = [
          { id: 'PROMO001', nombre: 'Temporada Alta -10%', descripcion: 'Descuento en temporada alta', descuento: 10, fechaInicio: '2025-11-01', fechaFin: '2025-12-31', activo: true },
          { id: 'PROMO002', nombre: 'Fin de Semana -15%', descripcion: 'Descuento para fines de semana', descuento: 15, fechaInicio: '2025-11-08', fechaFin: '2026-03-31', activo: true },
          { id: 'PROMO003', nombre: 'Grupo Familiar -20%', descripcion: 'Alquiler grupal', descuento: 20, fechaInicio: '2025-10-01', fechaFin: '2025-10-31', activo: false },
        ];
        setPromociones(data);
      } catch (err) {
        console.error('Error al cargar promociones:', err);
        setError('No se pudieron cargar las promociones.');
      } finally {
        setLoading(false);
      }
    };

    cargarPromociones();
  }, []);

  const filteredPromociones = promociones.filter((promo) =>
    promo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PromocionCard = ({ promo }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
            promo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {promo.activo ? 'Activa' : 'Inactiva'}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">{promo.nombre}</h3>
          <p className="text-gray-600 text-sm mt-1">{promo.descripcion}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
          -{promo.descuento}%
        </span>
      </div>

      <div className="mt-4 flex items-center text-sm text-gray-500">
        <Calendar className="w-4 h-4 mr-1" />
        {promo.fechaInicio} – {promo.fechaFin}
      </div>

      <div className="mt-6 flex space-x-3">
        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </button>
        <button className="flex-1 border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center">
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </button>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Percent className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
      <p className="text-gray-600">Aún no has creado ninguna promoción.</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestionar Promociones</h1>
        <p className="text-gray-600 mt-2">Administra descuentos, cupones y promociones activas en tu sistema.</p>
      </div>

      {/* Barra de búsqueda y botón de crear */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            className="outline-none text-gray-700 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Crear Promoción
        </button>
      </div>

      {/* Lista de promociones */}
      {filteredPromociones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromociones.map((promo) => (
            <PromocionCard key={promo.id} promo={promo} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default GestionarPromocionesPage;