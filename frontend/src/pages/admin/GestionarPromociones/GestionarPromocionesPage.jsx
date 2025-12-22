// src/pages/admin/GestionarPromocionesPage.jsx
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit, Trash2, Calendar, Percent, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { promocionService } from '../../../services/api';
import FormularioPromocion from './components/FormularioPromocion';
import FormularioNuevaPromocion from './components/FormularioNuevaPromocion';

const GestionarPromocionesPage = ({ user }) => {
  const [promociones, setPromociones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCrearForm, setShowCrearForm] = useState(false);
  const [promocionEditando, setPromocionEditando] = useState(null);

  // Cargar promociones reales (sin datos simulados)
  useEffect(() => {
    const cargarPromociones = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await promocionService.obtenerTodas();
        setPromociones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando promociones:', err);
        setError('No se pudieron cargar las promociones.');
      } finally {
        setLoading(false);
      }
    };
    cargarPromociones();
  }, []);

  // Función para crear nueva promoción
  const crearPromocion = async (nuevaPromocion) => {
    try {
      const promocionCreada = await promocionService.crear(nuevaPromocion);
      setPromociones([...promociones, promocionCreada]);
      alert('Promoción creada exitosamente');
      return true;
    } catch (error) {
      const serverMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
      alert('Error al crear promoción: ' + serverMsg);
      return false;
    }
  };

  // Función para editar promoción
  const editarPromocion = async (idPromocion, datosActualizados) => {
    try {
      const promocionActualizada = await promocionService.actualizar(idPromocion, datosActualizados);
      setPromociones(promociones.map(p => 
        p.idPromocion === idPromocion ? promocionActualizada : p
      ));
      alert('Promoción actualizada exitosamente');
      return true;
    } catch (error) {
      alert('Error al actualizar promoción: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };

  // Función para cambiar estado de promoción
  const togglePromocionActiva = async (promocion) => {
    try {
      const actualizado = await promocionService.toggle(promocion.idPromocion);
      setPromociones(prev => prev.map(p => p.idPromocion === actualizado.idPromocion ? actualizado : p));
    } catch (error) {
      alert('Error al cambiar estado de promoción');
    }
  };

  // Función para eliminar promoción
  const eliminarPromocion = async (idPromocion) => {
    if (!confirm('¿Está seguro de eliminar esta promoción?')) return;
    
    try {
      await promocionService.eliminar(idPromocion);
      setPromociones(promociones.filter(p => p.idPromocion !== idPromocion));
      alert('Promoción eliminada exitosamente');
    } catch (error) {
      alert('Error al eliminar promoción: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredPromociones = promociones.filter((promo) =>
    promo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.idPromocion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PromocionCard = ({ promo }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              promo.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {promo.activa ? 'Activa' : 'Inactiva'}
            </span>
            <button
              onClick={() => togglePromocionActiva(promo)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={promo.activa ? 'Desactivar promoción' : 'Activar promoción'}
            >
              {promo.activa ? 
                <ToggleRight className="w-5 h-5 text-green-600" /> : 
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              }
            </button>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{promo.nombre}</h3>
          <p className="text-gray-600 text-sm mt-1">{promo.descripcion}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold ml-3">
          -{promo.porcentajeDesc}%
        </span>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Tag className="w-4 h-4 mr-1" />
          ID: {promo.idPromocion}
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button 
          onClick={() => {
            setPromocionEditando(promo);
            setShowCrearForm(true);
          }}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </button>
        <button 
          onClick={() => eliminarPromocion(promo.idPromocion)}
          className="flex-1 border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
        >
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

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestionar Promociones</h1>
        <p className="text-gray-600 mt-2">Administra descuentos y promociones activas en tu sistema.</p>
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
        <button 
          onClick={() => setShowCrearForm(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Promoción
        </button>
      </div>

      {/* Lista de promociones */}
      {filteredPromociones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromociones.map((promo) => (
            <PromocionCard key={promo.idPromocion} promo={promo} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Modal para crear/editar promoción */}
      {showCrearForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {promocionEditando ? 'Editar Promoción' : 'Nueva Promoción'}
            </h2>
            {promocionEditando ? (
              <FormularioPromocion 
                promocion={promocionEditando}
                onSubmit={async (data) => {
                  const exito = await editarPromocion(promocionEditando.idPromocion, data);
                  if (exito) {
                    setShowCrearForm(false);
                    setPromocionEditando(null);
                  }
                }}
                onCancel={() => {
                  setShowCrearForm(false);
                  setPromocionEditando(null);
                }}
              />
            ) : (
              <FormularioNuevaPromocion
                onSubmit={async (data) => {
                  const exito = await crearPromocion(data);
                  if (exito) {
                    setShowCrearForm(false);
                    setPromocionEditando(null);
                  }
                }}
                onCancel={() => {
                  setShowCrearForm(false);
                  setPromocionEditando(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarPromocionesPage;