// src/pages/admin/GestionarAlquileres/components/FormularioNuevoCliente.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';

const FormularioNuevoCliente = ({ onClose, onSuccess }) => {
  const [newClientData, setNewClientData] = useState({
    nombres: '',
    apellidos: '',
    dniPasaporte: '',
    nacionalidad: '',
    telefono: '',
    email: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/turistas', newClientData);
      alert('Cliente creado exitosamente!');
      console.log('Cliente creado:', response.data);
      onSuccess(response.data);
      setNewClientData({
        nombres: '',
        apellidos: '',
        dniPasaporte: '',
        nacionalidad: '',
        telefono: '',
        email: ''
      });
      onClose();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('Error al crear el cliente. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Nuevo Cliente</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleCreateClient} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombres</label>
            <input
              type="text"
              name="nombres"
              value={newClientData.nombres}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellidos</label>
            <input
              type="text"
              name="apellidos"
              value={newClientData.apellidos}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">DNI/Pasaporte</label>
          <input
            type="text"
            name="dniPasaporte"
            value={newClientData.dniPasaporte}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nacionalidad</label>
          <input
            type="text"
            name="nacionalidad"
            value={newClientData.nacionalidad}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={newClientData.telefono}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={newClientData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar Cliente
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioNuevoCliente;