import React from 'react';
import { Save, X, User as UserIcon } from 'lucide-react';

export default function PerfilSection({ userData, profileData, setProfileData, editMode, setEditMode, loading, onSaveProfile }) {
  return (
    <div className="space-y-4">
      {/* Resumen del usuario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-sm text-gray-500">Usuario</div>
          <div className="text-lg font-semibold text-gray-900">{userData.nombre} {userData.apellidos}</div>
          <div className="text-sm text-gray-600">@{userData.username}</div>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
            {userData.rol}
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre</label>
            <input placeholder="Ej: David" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={!editMode || loading} value={profileData.nombre} onChange={(e)=>setProfileData(p=>({...p,nombre:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Apellidos</label>
            <input placeholder="Ej: Lucano Zurita" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={!editMode || loading} value={profileData.apellidos} onChange={(e)=>setProfileData(p=>({...p,apellidos:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <input placeholder="Ej: jefe_David" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={!editMode || loading} value={profileData.username} onChange={(e)=>setProfileData(p=>({...p,username:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
            <input placeholder="Ej: 999123456" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={!editMode || loading} value={profileData.telefono} onChange={(e)=>setProfileData(p=>({...p,telefono:e.target.value}))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input placeholder="Ej: jefe@acme.com" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={!editMode || loading} value={profileData.email} onChange={(e)=>setProfileData(p=>({...p,email:e.target.value}))} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        {!editMode ? (
          <button onClick={()=> setEditMode(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
            <UserIcon className="w-4 h-4" /> Editar
          </button>
        ) : (
          <>
            <button onClick={onSaveProfile} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60" disabled={loading}>
              <Save className="w-4 h-4" /> Guardar cambios
            </button>
            <button onClick={()=>{ setEditMode(false); setProfileData({ nombre:userData.nombre, apellidos:userData.apellidos, username:userData.username, telefono:userData.telefono, email:userData.email }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-60" disabled={loading}>
              <X className="w-4 h-4" /> Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
