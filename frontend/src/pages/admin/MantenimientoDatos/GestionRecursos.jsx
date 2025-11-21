import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, MapPin, DollarSign, Tag, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

const GestionRecursos = () => {
  const [recursos, setRecursos] = useState([]);
  const [tiposRecurso, setTiposRecurso] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tarifaHora: '',
    estado: 'disponible',
    ubicacion: '',
    idTipo: ''
  });

  useEffect(() => {
    cargarRecursos();
    cargarTiposRecurso();
  }, []);

  const cargarRecursos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/recursos');
      setRecursos(response.data);
    } catch (error) {
      console.error('Error al cargar recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposRecurso = async () => {
    try {
      const response = await api.get('/tipos-recursos');
      setTiposRecurso(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de recurso:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        tarifaHora: parseFloat(formData.tarifaHora)
      };
      
      if (editingResource) {
        await api.put(`/recursos/${editingResource.idRecurso}`, dataToSend);
      } else {
        await api.post('/recursos', dataToSend);
      }
      setShowModal(false);
      setEditingResource(null);
      resetForm();
      cargarRecursos();
    } catch (error) {
      console.error('Error al guardar recurso:', error);
    }
  };

  const handleEdit = (recurso) => {
    setEditingResource(recurso);
    setFormData({
      nombre: recurso.nombre || '',
      descripcion: recurso.descripcion || '',
      tarifaHora: recurso.tarifaHora || '',
      estado: recurso.estado || 'disponible',
      ubicacion: recurso.ubicacion || '',
      idTipo: recurso.idTipo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este recurso?')) {
      try {
        await api.delete(`/recursos/${id}`);
        cargarRecursos();
      } catch (error) {
        console.error('Error al eliminar recurso:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tarifaHora: '',
      estado: 'disponible',
      ubicacion: '',
      idTipo: ''
    });
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      'disponible': { color: 'bg-green-100 text-green-800', label: 'Disponible' },
      'alquilado': { color: 'bg-red-100 text-red-800', label: 'Alquilado' },
      'mantenimiento': { color: 'bg-yellow-100 text-yellow-800', label: 'Mantenimiento' },
      'fuera_servicio': { color: 'bg-gray-100 text-gray-800', label: 'Fuera de Servicio' }
    };
    const estadoInfo = estados[estado] || estados['disponible'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.color}`}>
        {estadoInfo.label}
      </span>
    );
  };

  const filteredRecursos = recursos.filter(recurso =>
    recurso.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recurso.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recurso.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-green-600" />
            Gestión de Recursos
          </h1>
          <p className="text-gray-600 mt-2">Administra los recursos turísticos disponibles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Recurso
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Grid de recursos */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
          <p className="text-gray-500">Cargando recursos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecursos.map((recurso) => (
            <div key={recurso.idRecurso} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{recurso.nombre}</h3>
                    <p className="text-sm text-gray-600 mb-3">{recurso.descripcion}</p>
                  </div>
                  <div className="ml-2">
                    {getEstadoBadge(recurso.estado)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                    <span className="font-medium text-green-600">
                      S/. {parseFloat(recurso.tarifaHora || 0).toFixed(2)}/hora
                    </span>
                  </div>
                  
                  {recurso.ubicacion && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      {recurso.ubicacion}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="h-4 w-4 mr-2 text-purple-500" />
                    ID: {recurso.idRecurso}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(recurso)}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(recurso.idRecurso)}
                    className="text-red-600 hover:text-red-900 flex items-center text-sm"
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

      {filteredRecursos.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No se encontraron recursos</p>
        </div>
      )}

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingResource(null);
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
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Cuatrimoto Todo Terreno (250cc)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Describe las características del recurso..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por Hora *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.tarifaHora}
                      onChange={(e) => setFormData({...formData, tarifaHora: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="alquilado">Alquilado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="fuera_servicio">Fuera de Servicio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ej: Zona Norte - Máncora"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Recurso</label>
                  <select
                    value={formData.idTipo}
                    onChange={(e) => setFormData({...formData, idTipo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {tiposRecurso.map(tipo => (
                      <option key={tipo.idTipo} value={tipo.idTipo}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingResource(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingResource ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionRecursos;