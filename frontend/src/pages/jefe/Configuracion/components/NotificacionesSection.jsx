import React from 'react';
import { Mail, Shield, Bell, Save } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function NotificacionesSection({ notifications, setNotifications, onSaveNotifications }) {
  const Item = ({ icon: Icon, title, description, checked, onChange }) => (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-blue-50 p-1.5">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      {/* Switch simple con checkbox accesible */}
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={title}
        />
        <div className="h-5 w-9 rounded-full bg-gray-200 transition peer-checked:bg-blue-600"></div>
        <div className="pointer-events-none absolute left-0.5 h-4 w-4 translate-x-0 rounded-full bg-white shadow transition peer-checked:translate-x-4"></div>
      </label>
    </div>
  );

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-4 py-5">
        <Item
          icon={Mail}
          title="Notificaciones por correo"
          description="Recibe confirmaciones y recordatorios en tu email."
          checked={notifications.email}
          onChange={(val) => setNotifications((p) => ({ ...p, email: val }))}
        />
        <Item
          icon={Shield}
          title="Notificaciones por SMS"
          description="Mensajes de texto para eventos importantes."
          checked={notifications.sms}
          onChange={(val) => setNotifications((p) => ({ ...p, sms: val }))}
        />
        <Item
          icon={Bell}
          title="Notificaciones push"
          description="Alertas en tu navegador (si están habilitadas)."
          checked={notifications.push}
          onChange={(val) => setNotifications((p) => ({ ...p, push: val }))}
        />
        <div className="pt-2">
          <Button variant="success" onClick={onSaveNotifications} className="gap-2">
            <Save className="h-4 w-4" /> Guardar preferencias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
