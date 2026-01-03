// src/components/shared/LoginForm.jsx

import React, { useState } from 'react';

// Íconos para la interfaz visual
import { User, Lock, AlertCircle } from 'lucide-react';

// Instancia de Axios configurada (baseURL, headers, token, etc.)
import api from '../../services/api';

// Componente LoginForm recibe onLogin desde el padre
const LoginForm = ({ onLogin = () => {} }) => {

  // Estados para controlar inputs y estados de la UI
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Función que se ejecuta al enviar el formulario
  const handleLogin = async (e) => {
    e.preventDefault();        // Evita recargar la página
    setError('');              // Limpia errores previos
    setLoading(true);          // Activa estado de carga

    try {
      // Enviar usuario y contraseña al backend
      const response = await api.post('/auth/login', {
        username,
        password
      });

      console.log('🔐 Respuesta del login:', response.data);

      let token;
      let userData;

      // Caso 1: backend devuelve SOLO el token como string
      if (typeof response.data === 'string') {
        token = response.data;
        userData = { username, token };

      // Caso 2: backend devuelve un objeto con token
      } else if (response.data.token) {
        token = response.data.token;
        userData = { username, ...response.data };

      // Caso inválido
      } else {
        throw new Error('Formato de respuesta inválido del servidor');
      }

      console.log('🔐 Token extraído:', token);

      // Guardar token JWT en localStorage
      localStorage.setItem('authToken', token);

      // Intentar obtener el perfil completo del usuario
      try {
        const meResp = await api.get('/auth/me');
        const perfil = meResp.data || {};

        // Adjuntamos el token al perfil
        perfil.token = token;

        // Normalizamos el rol (por seguridad)
        perfil.rol = (perfil.rol || perfil.role || '').toString();

        // Guardamos perfil completo
        localStorage.setItem('userData', JSON.stringify(perfil));

        // Avisamos al componente padre
        onLogin(perfil);

      } catch (errMe) {
        // Si falla /auth/me usamos datos mínimos
        console.warn('No se pudo obtener /auth/me', errMe);
        userData.token = token;
        localStorage.setItem('userData', JSON.stringify(userData));
        onLogin(userData);
      }

    } catch (err) {
      // Error de login o servidor
      console.error('Error de conexión o login:', err);
      setError(
        err.response?.data?.message ||
        'Usuario o contraseña incorrectos, o el servidor no responde.'
      );
    } finally {
      // Siempre desactiva loading
      setLoading(false);
    }
  };

  // JSX (vista)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* Fondo decorativo */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white"
        style={{ backdropFilter: 'blur(80px)' }}
      />

      <div className="relative w-full max-w-md">
        <div className="bg-white/80 rounded-2xl shadow-xl border">

          {/* Encabezado */}
          <div className="bg-black py-6 px-8 text-center">
            <h1 className="text-xl font-semibold text-white">
              Sistema de Alquiler Turístico
            </h1>
            <p className="text-gray-300 text-sm">
              Inicie sesión para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="p-7">

            {/* Mensaje de error */}
            {error && (
              <div className="mb-5 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Usuario */}
            <div className="mb-5">
              <label className="block text-sm font-medium">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10 w-full border rounded-lg py-3"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="mb-6">
              <label className="block text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10 w-full border rounded-lg py-3"
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;