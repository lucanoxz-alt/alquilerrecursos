import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Search, Package, List } from 'lucide-react';
import api from '@/services/api';

const GestionTiposRecursos = () => {
  const [tiposRecursos, setTiposRecursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarTiposRecursos();
  }, []);

  const cargarTiposRecursos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tipos-recursos');
      setTiposRecursos(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await api.put(`/tipos-recursos/${editingType.idTipo}`, formData);
      } else {
        await api.post('/tipos-recursos', formData);
      }
      setShowModal(false);
      setEditingType(null);
      resetForm();
      cargarTiposRecursos();
    } catch (error) {
      console.error('Error al guardar tipo de recurso:', error);
    }
  };

  const handleEdit = (tipo) => {
    setEditingType(tipo);
    setFormData({
      nombre: tipo.nombre || '',
      descripcion: tipo.descripcion || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este tipo de recurso?')) {
      try {
        // Verificar que no haya recursos usando este tipo
        const recursosDeEsteTipo = await api.get(`/recursos/tipo/${id}`).then(r => r.data);
        if (Array.isArray(recursosDeEsteTipo) && recursosDeEsteTipo.length > 0) {
          alert('No se puede eliminar: existen recursos asociados a este tipo.');
          return;
        }
        await api.delete(`/tipos-recursos/${id}`);
        cargarTiposRecursos();
      } catch (error) {
        console.error('Error al eliminar tipo de recurso:', error);
        alert(error?.response?.data || 'No se pudo eliminar el tipo de recurso');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: ''
    });
  };

  const filteredTipos = tiposRecursos.filter(tipo =>
    tipo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Tag className="w-8 h-8 mr-3 text-purple-600" />
            Gestión de Tipos de Recursos
          </h1>
          <p className="text-gray-600 mt-2">Define categorías para los recursos turísticos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Tipo
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tipos de recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Grid de tipos de recursos */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-gray-500">Cargando tipos de recursos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTipos.map((tipo) => (
            <div key={tipo.idTipo} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg mr-4">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{tipo.nombre}</h3>
                    <p className="text-sm text-gray-500">ID: {tipo.idTipo}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {tipo.descripcion || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(tipo)}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm font-medium"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(tipo.idTipo)}
                    className="text-red-600 hover:text-red-900 flex items-center text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTipos.length === 0 && !loading && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No se encontraron tipos de recursos</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear el primer tipo
          </button>
        </div>
      )}

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingType ? 'Editar Tipo de Recurso' : 'Nuevo Tipo de Recurso'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingType(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Cuatrimotos, Kayaks, Tablas de Surf"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <div className="relative">
                  <List className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows="4"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe el tipo de recursos que incluye esta categoría..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingType(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingType ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTiposRecursos;