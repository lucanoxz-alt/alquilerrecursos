import React from 'react';
import { Mail, Shield, Bell, Save } from 'lucide-react';

export default function NotificacionesSection({ notifications, setNotifications, onSaveNotifications }) {
  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-600" />
          <span>Notificaciones por correo</span>
        </div>
        <input type="checkbox" checked={!!notifications.email} onChange={(e)=>setNotifications(p=>({...p,email:e.target.checked}))} />
      </div>
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-600" />
          <span>Notificaciones por SMS</span>
        </div>
        <input type="checkbox" checked={!!notifications.sms} onChange={(e)=>setNotifications(p=>({...p,sms:e.target.checked}))} />
      </div>
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <span>Notificaciones push</span>
        </div>
        <input type="checkbox" checked={!!notifications.push} onChange={(e)=>setNotifications(p=>({...p,push:e.target.checked}))} />
      </div>
      <button onClick={onSaveNotifications} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
        <Save className="w-4 h-4" /> Guardar preferencias
      </button>
    </div>
  );
}
