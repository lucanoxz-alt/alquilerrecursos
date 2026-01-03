import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, User, CreditCard, Phone, Mail, Globe } from 'lucide-react';
import api from '@/services/api';

const GestionClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dniPasaporte: '',
    nacionalidad: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/turistas');
      setClientes(response.data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      // Si no existe el endpoint, mostrar datos vacíos en lugar de redireccionar
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/turistas/${editingClient.idTurista}`, formData);
      } else {
        await api.post('/turistas', formData);
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      cargarClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar cliente. Verifica que el backend esté funcionando correctamente.');
    }
  };

  const handleEdit = (cliente) => {
    setEditingClient(cliente);
    setFormData({
      nombres: cliente.nombres || '',
      apellidos: cliente.apellidos || '',
      dniPasaporte: cliente.dniPasaporte || '',
      nacionalidad: cliente.nacionalidad || '',
      telefono: cliente.telefono || '',
      email: cliente.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await api.delete(`/turistas/${id}`);
        cargarClientes();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar cliente. Verifica que el backend esté funcionando correctamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      dniPasaporte: '',
      nacionalidad: '',
      telefono: '',
      email: ''
    });
  };

  const exportarCSV = () => {
    if (!clientes || clientes.length === 0) {
      alert('No hay clientes para exportar');
      return;
    }
    const sep = ';';
    const headers = ['ID','NOMBRES','APELLIDOS','DNI/PASAPORTE','NACIONALIDAD','TELEFONO','EMAIL'];
    const rows = [headers.join(sep)];
    const esc = (v) => String(v ?? '').replace(/"/g, '""');
    clientes.forEach(c => {
      rows.push([
        esc(c.idTurista),
        '"'+esc(c.nombres)+'"',
        '"'+esc(c.apellidos)+'"',
        '"'+esc(c.dniPasaporte)+'"',
        '"'+esc(c.nacionalidad)+'"',
        '"'+esc(c.telefono)+'"',
        '"'+esc(c.email)+'"',
      ].join(sep));
    });
    const BOM='\uFEFF';
    const blob = new Blob([BOM + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `clientes_${Date.now()}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length <= 1) { alert('Archivo vacío'); return; }
      const sep = text.includes(';') ? ';' : ',';
      const [header, ...dataLines] = lines;
      // Mapear columnas por nombre (flexible)
      const cols = header.split(sep).map(h => h.trim().replace(/^"|"$/g,''));
      const idx = (name) => cols.findIndex(c => c.toLowerCase().includes(name));
      const idxNombres = idx('nomb');
      const idxApellidos = idx('apell');
      const idxDni = idx('dni') >=0 ? idx('dni') : idx('pasap');
      const idxNac = idx('nacion');
      const idxTel = idx('tele');
      const idxMail = idx('mail');
      let countOk = 0, countErr = 0;
      for (const line of dataLines) {
        const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g,''));
        const payload = {
          nombres: parts[idxNombres] || '',
          apellidos: parts[idxApellidos] || '',
          dniPasaporte: parts[idxDni] || '',
          nacionalidad: parts[idxNac] || '',
          telefono: parts[idxTel] || '',
          email: parts[idxMail] || ''
        };
        if (!payload.nombres || !payload.apellidos || !payload.dniPasaporte) { countErr++; continue; }
        try {
          await api.post('/turistas', payload);
          countOk++;
        } catch (err) {
          console.error('Error creando cliente', err);
          countErr++;
        }
      }
      alert(`Importación finalizada. Creados: ${countOk}, con errores: ${countErr}`);
      cargarClientes();
    } catch (err) {
      console.error('Error importando CSV', err);
      alert('Error importando el archivo');
    } finally {
      e.target.value = '';
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.dniPasaporte?.includes(searchTerm)
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 mt-2">Administra la información de turistas y clientes</p>
        </div>
        <div className="flex gap-2">
          <label className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 border flex items-center cursor-pointer" title="Importar desde Excel (CSV)">
            Importar
            <input type="file" accept=".csv" onChange={onImportFile} className="hidden" />
          </label>
          <button
            onClick={exportarCSV}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 border flex items-center"
            title="Exportar a Excel (CSV)"
          >
            Exportar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-500">Cargando clientes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nacionalidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.idTurista} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-full mr-3">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nombres} {cliente.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">ID: {cliente.idTurista}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                        {cliente.dniPasaporte}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.telefono && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Globe className="h-4 w-4 mr-2 text-gray-400" />
                        {cliente.nacionalidad || 'No especificada'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.idTurista)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClientes.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No se encontraron clientes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClient(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.nombres}
                      onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI/Pasaporte *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.dniPasaporte}
                      onChange={(e) => setFormData({...formData, dniPasaporte: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.nacionalidad}
                      onChange={(e) => setFormData({...formData, nacionalidad: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingClient ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionClientes;