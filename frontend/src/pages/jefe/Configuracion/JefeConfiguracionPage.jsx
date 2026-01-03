// src/pages/jefe/Configuracion/JefeConfiguracionPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Settings, User, Mail, Key, Bell, Shield, Save, X, Check, AlertCircle } from 'lucide-react';
import PerfilSection from './components/PerfilSection';
import SeguridadSection from './components/SeguridadSection';
import NotificacionesSection from './components/NotificacionesSection';
import api from '@/services/api';

function classNames(...cls) { return cls.filter(Boolean).join(' '); }

const ConfiguracionPage = ({ user }) => {
  const role = useMemo(() => String(user?.rol || user?.role || '').trim().toUpperCase(), [user]);
  const username = user?.username || user?.userName || '';
  const [activeTab, setActiveTab] = useState('perfil'); // perfil | seguridad | notificaciones

  // Estado general
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Datos del usuario (desde backend)
  const [userId, setUserId] = useState(user?.idUsuario || '');
  const [userData, setUserData] = useState({
    idUsuario: user?.idUsuario || '',
    nombre: user?.nombre || '',
    apellidos: user?.apellidos || '',
    username: user?.username || '',
    telefono: user?.telefono || '',
    email: user?.email || '',
    rol: role,
  });

  // Edición de perfil
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: userData.nombre,
    apellidos: userData.apellidos,
    username: userData.username,
    telefono: userData.telefono,
    email: userData.email,
  });

  // Seguridad (cambio de contraseña)
  const [securityData, setSecurityData] = useState({
    currentPassword: '', // validación local únicamente
    newPassword: '',
    confirmNewPassword: '',
  });

  // Notificaciones (guardado local por ahora)
  const notifKey = useMemo(() => `notif_prefs_${username || 'anon'}`,[username]);
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem(notifKey);
      return raw ? JSON.parse(raw) : { email: true, sms: false, push: false };
    } catch {
      return { email: true, sms: false, push: false };
    }
  });

  // Helpers
  const clearMessages = () => { setError(''); setSuccess(''); };
  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };
  const flashError = (msg) => { setError(msg); setTimeout(() => setError(''), 4500); };
  const initials = (userData.nombre || user?.nombre || '?').trim().charAt(0).toUpperCase() + (userData.apellidos || user?.apellidos || '').trim().charAt(0).toUpperCase();

  const fetchUserById = async (id) => {
    const { data } = await api.get(`/usuarios/${id}`);
    return data;
  };

  const fetchUserByUsername = async (uname) => {
    const { data } = await api.get('/usuarios');
    return (data || []).find(u => (u?.username || '').toLowerCase() === String(uname).toLowerCase());
  };

  // Cargar datos reales del usuario
  useEffect(() => {
    const load = async () => {
      if (!username) return; // no autenticado
      setLoading(true); clearMessages();
      try {
        let u = null;
        if (user?.idUsuario) {
          u = await fetchUserById(user.idUsuario);
        } else {
          u = await fetchUserByUsername(username);
        }
        if (u) {
          setUserId(u.idUsuario);
          setUserData({
            idUsuario: u.idUsuario,
            nombre: u.nombre || '',
            apellidos: u.apellidos || '',
            username: u.username || '',
            telefono: u.telefono || '',
            email: u.email || '',
            rol: u.rol || role,
          });
          setProfileData({
            nombre: u.nombre || '',
            apellidos: u.apellidos || '',
            username: u.username || '',
            telefono: u.telefono || '',
            email: u.email || '',
          });
        } else {
          setError('No se pudo cargar los datos del usuario');
        }
      } catch (e) {
        setError('Error al cargar usuario: ' + (e?.response?.data || e?.message || 'desconocido'));
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const forceLogout = (reasonMsg) => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userData');
    } catch {}
    const qs = reasonMsg ? `?msg=${encodeURIComponent(reasonMsg)}` : '';
    window.location.assign(`/login${qs}`);
  };

  // Guardar perfil
  const onSaveProfile = async () => {
    clearMessages();
    if (!userId) { setError('Usuario no identificado'); return; }
    if (!profileData.username || !profileData.email) {
      setError('Username y email son obligatorios');
      return;
    }
    const usernameChanged = String(profileData.username) !== String(userData.username);
    setLoading(true);
    try {
      const payload = {
        nombre: profileData.nombre || '',
        apellidos: profileData.apellidos || '',
        username: profileData.username || '',
        telefono: profileData.telefono || '',
        email: profileData.email || '',
      };
      const { data: updated } = await api.put(`/usuarios/${userId}`, payload);
      setUserData({
        idUsuario: updated.idUsuario,
        nombre: updated.nombre || '',
        apellidos: updated.apellidos || '',
        username: updated.username || '',
        telefono: updated.telefono || '',
        email: updated.email || '',
        rol: updated.rol || role,
      });
      setEditMode(false);
      if (usernameChanged) {
        flashSuccess('Perfil actualizado. Debes volver a iniciar sesión. Redirigiendo...');
        setTimeout(() => forceLogout('Tu usuario fue actualizado, vuelve a iniciar sesión'), 1200);
      } else {
        flashSuccess('Perfil actualizado correctamente');
      }
    } catch (e) {
      setError('No se pudo actualizar el perfil: ' + (e?.response?.data || e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Guardar seguridad (cambiar contraseña)
  const onChangePassword = async () => {
    clearMessages();
    const { currentPassword, newPassword, confirmNewPassword } = securityData;
    if (!newPassword || newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('La confirmación de contraseña no coincide');
      return;
    }
    if (!userId) { setError('Usuario no identificado'); return; }
    setLoading(true);
    try {
      await api.put(`/usuarios/${userId}`, { password: newPassword });
      setSecurityData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      flashSuccess('Contraseña actualizada. Debes volver a iniciar sesión. Redirigiendo...');
      setTimeout(() => forceLogout('Tu contraseña fue actualizada, vuelve a iniciar sesión'), 1200);
    } catch (e) {
      setError('No se pudo actualizar la contraseña: ' + (e?.response?.data || e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Guardar notificaciones (localStorage)
  const onSaveNotifications = () => {
    clearMessages();
    try {
      localStorage.setItem(notifKey, JSON.stringify(notifications));
      setSuccess('Preferencias de notificación guardadas');
    } catch (e) {
      setError('No se pudieron guardar las preferencias');
    }
  };

  // UI helpers
  const TabButton = ({ id, icon: Icon, children }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={classNames(
        'px-4 py-2 rounded-lg flex items-center gap-2 border transition-colors',
        activeTab === id
          ? 'bg-blue-600 text-white border-blue-600 shadow'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      )}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  );

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4 p-6">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                <Settings className="h-6 w-6 text-blue-600" /> Configuración
              </h1>
              <p className="text-sm text-gray-600">Gestiona tu perfil, seguridad y preferencias del sistema xdxddxd.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <TabButton id="perfil" icon={User}>Perfil</TabButton>
          <TabButton id="seguridad" icon={Key}>Seguridad</TabButton>
          <TabButton id="notificaciones" icon={Bell}>Notificaciones</TabButton>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-green-700">
            <Check className="h-4 w-4" /> {success}
          </div>
        )}

        {/* Contenido */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {activeTab === 'perfil' && (
            <PerfilSection
              userData={userData}
              profileData={profileData}
              setProfileData={setProfileData}
              editMode={editMode}
              setEditMode={setEditMode}
              loading={loading}
              onSaveProfile={onSaveProfile}
            />
          )}

          {activeTab === 'seguridad' && (
            <SeguridadSection
              securityData={securityData}
              setSecurityData={setSecurityData}
              loading={loading}
              onChangePassword={onChangePassword}
            />
          )}

          {activeTab === 'notificaciones' && (
            <NotificacionesSection
              notifications={notifications}
              setNotifications={setNotifications}
              onSaveNotifications={onSaveNotifications}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
