// src/pages/jefe/MantenimientoDatos/JefeMantenimientoDatosPage.jsx
import React from 'react';
import { Users, Package, Tag, Shield, Database, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const JefeMantenimientoDatosPage = ({ user }) => {
  const role = (user?.rol || user?.role || '').toString().trim().toUpperCase();
  const baseRoot = role === 'EMPLEADO' ? '/empleado' : role === 'JEFE' ? '/jefe' : '/admin';

  let dataModules = [
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Gestiona la información de los turistas y clientes registrados.',
      icon: Users,
      color: 'blue',
      path: `${baseRoot}/mantenimiento/clientes`
    },
    {
      id: 'recursos',
      title: 'Recursos',
      description: 'Administra los recursos turísticos disponibles para alquiler.',
      icon: Package,
      color: 'green',
      path: `${baseRoot}/mantenimiento/recursos`
    },
    {
      id: 'tipos-recursos',
      title: 'Tipos de Recursos',
      description: 'Define categorías y tipos de recursos (cuatrimotos, kayaks, etc.).',
      icon: Tag,
      color: 'purple',
      path: `${baseRoot}/mantenimiento/tipos-recursos`
    },
    {
      id: 'usuarios',
      title: 'Usuarios del Sistema',
      description: 'Administra los usuarios operativos (jefes, empleados, etc.).',
      icon: Shield,
      color: 'orange',
      path: `${baseRoot}/mantenimiento/usuarios`
    }
  ];

  // Filtrado por rol
  if (role === 'EMPLEADO') {
    // Empleado: solo Clientes y Recursos
    dataModules = dataModules.filter(m => ['clientes','recursos'].includes(m.id));
  } else if (role === 'ADMINISTRADOR') {
    // Admin: sin Usuarios (solo JEFE)
    dataModules = dataModules.filter(m => m.id !== 'usuarios');
  }

  const DataCard = ({ module }) => {
    const Icon = module.icon;
    return (
      <Link to={module.path} className="block">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full">
          <div className={`w-12 h-12 rounded-lg bg-${module.color}-100 border border-${module.color}-200 shadow-sm flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 text-${module.color}-600`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
          <p className="text-gray-600 text-sm">{module.description}</p>
          <div className="mt-4 flex space-x-2">
            <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center">
              <Edit className="w-3 h-3 mr-1" /> Editar
            </button>
            <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center">
              <Trash2 className="w-3 h-3 mr-1" /> Eliminar
            </button>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mantenimiento de Datos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona las entidades maestras del sistema: clientes, recursos, tipos y usuarios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {dataModules.map((module) => (
          <DataCard key={module.id} module={module} />
        ))}
      </div>

      <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex">
          <Database className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Los cambios en los datos maestros afectan directamente a los módulos de alquileres y reservas.
            Asegúrate de tener los permisos necesarios antes de realizar modificaciones.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JefeMantenimientoDatosPage;
