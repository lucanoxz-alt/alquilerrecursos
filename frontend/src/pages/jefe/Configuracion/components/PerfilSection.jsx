import React from 'react';
import { Save, X, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui';

export default function PerfilSection({ userData, profileData, setProfileData, editMode, setEditMode, loading, onSaveProfile }) {
  const Input = ({ label, ...props }) => (
    <div>
      <label className="mb-1 block text-sm text-gray-600">{label}</label>
      <input
        className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50"
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Resumen del usuario */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-gray-900">
              <UserIcon className="h-5 w-5 text-blue-600" /> Perfil
            </CardTitle>
            <CardDescription>Información del usuario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                {String(userData.nombre || '?').charAt(0)}
              </div>
              <div>
                <div className="text-sm text-gray-500">{userData.rol}</div>
                <div className="font-semibold text-gray-900">{userData.nombre} {userData.apellidos}</div>
                <div className="text-sm text-gray-600">@{userData.username}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Datos personales</CardTitle>
            <CardDescription>Edita tu información básica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Nombre" placeholder="Ej: David" disabled={!editMode || loading} value={profileData.nombre} onChange={(e)=>setProfileData(p=>({...p,nombre:e.target.value}))} />
              <Input label="Apellidos" placeholder="Ej: Lucano Zurita" disabled={!editMode || loading} value={profileData.apellidos} onChange={(e)=>setProfileData(p=>({...p,apellidos:e.target.value}))} />
              <Input label="Username" placeholder="Ej: jefe_David" disabled={!editMode || loading} value={profileData.username} onChange={(e)=>setProfileData(p=>({...p,username:e.target.value}))} />
              <Input label="Teléfono" placeholder="Ej: 999123456" disabled={!editMode || loading} value={profileData.telefono} onChange={(e)=>setProfileData(p=>({...p,telefono:e.target.value}))} />
              <div className="md:col-span-2">
                <Input label="Email" placeholder="Ej: jefe@acme.com" disabled={!editMode || loading} value={profileData.email} onChange={(e)=>setProfileData(p=>({...p,email:e.target.value}))} />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              {!editMode ? (
                <Button onClick={()=> setEditMode(true)} disabled={loading} className="gap-2">
                  <UserIcon className="h-4 w-4" /> Editar
                </Button>
              ) : (
                <>
                  <Button variant="success" onClick={onSaveProfile} disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" /> Guardar cambios
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={()=>{ setEditMode(false); setProfileData({ nombre:userData.nombre, apellidos:userData.apellidos, username:userData.username, telefono:userData.telefono, email:userData.email }); }}
                    disabled={loading}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
