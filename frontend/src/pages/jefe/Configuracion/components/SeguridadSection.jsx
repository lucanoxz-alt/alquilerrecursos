import React from 'react';
import { Key } from 'lucide-react';

export default function SeguridadSection({ securityData, setSecurityData, loading, onChangePassword }) {
  return (
    <div className="space-y-5 max-w-xl">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Cambiar contraseña</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña actual</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={securityData.currentPassword} onChange={(e)=>setSecurityData(p=>({...p,currentPassword:e.target.value}))} />
            <p className="text-xs text-gray-500 mt-1">Nota: validación local. El backend no la verifica.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={securityData.newPassword} onChange={(e)=>setSecurityData(p=>({...p,newPassword:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirmar nueva contraseña</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={securityData.confirmNewPassword} onChange={(e)=>setSecurityData(p=>({...p,confirmNewPassword:e.target.value}))} />
          </div>
          <button onClick={onChangePassword} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
            <Key className="w-4 h-4" /> Cambiar contraseña
          </button>
        </div>
      </div>
    </div>
  );
}
