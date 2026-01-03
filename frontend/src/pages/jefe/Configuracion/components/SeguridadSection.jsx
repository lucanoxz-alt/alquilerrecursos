import React from 'react';
import { Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

export default function SeguridadSection({ securityData, setSecurityData, loading, onChangePassword }) {
  const Input = ({ label, hint, ...props }) => (
    <div>
      <label className="mb-1 block text-sm text-gray-600">{label}</label>
      <input
        className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-5 w-5 text-blue-600" /> Cambiar contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={securityData.currentPassword}
            onChange={(e)=>setSecurityData(p=>({...p,currentPassword:e.target.value}))}
            hint="Nota: validación local. El backend no la verifica."
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={securityData.newPassword}
            onChange={(e)=>setSecurityData(p=>({...p,newPassword:e.target.value}))}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={securityData.confirmNewPassword}
            onChange={(e)=>setSecurityData(p=>({...p,confirmNewPassword:e.target.value}))}
          />
          <Button onClick={onChangePassword} disabled={loading} className="gap-2">
            <Key className="h-4 w-4" /> Cambiar contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
