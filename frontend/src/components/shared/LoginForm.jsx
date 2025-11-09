// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';
import api from '@/services/api'; // Usando el alias '@' definido en vite.config.js

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Usamos api.post en lugar de fetch
      const response = await api.post('/auth/login', {
        username,
        password
      });

      // El backend ahora devuelve SOLO el token como string
      const token = response.data; // response.data es el token JWT puro

      // Guardar el token JWT en localStorage
      localStorage.setItem('authToken', token);

      // Opcional: Puedes guardar más datos del usuario si los necesitas en otro lado
      // Por ejemplo, si el backend también devuelve el username o rol:
      // const userData = response.data; // Si devuelves un objeto { token, username, role }
      // localStorage.setItem('userData', JSON.stringify({ username: userData.username, role: userData.role }));

      // Llamar a la función `onLogin` (esto probablemente redirige o actualiza el estado de la app)
      // Aquí puedes pasar el rol si lo necesitas, pero para guardar el token, ya está en localStorage
      onLogin({ token }); // Ajusta según lo que necesite `onLogin`

    } catch (err) {
      console.error('Error de conexión o login:', err);
      setError(err.response?.data?.message || 'Usuario o contraseña incorrectos, o el servidor no responde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white"
        style={{
          backdropFilter: 'blur(80px)',
          WebkitBackdropFilter: 'blur(80px)'
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-black py-6 px-8 text-center">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Sistema de Alquiler Turístico
            </h1>
            <p className="text-gray-300 text-sm mt-1">Inicie sesión para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="p-7">
            {error && (
              <div className="mb-5 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="username" className="block text-sm font-medium text-gray-800 mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                  placeholder="ej. empleado"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full ${loading ? 'bg-gray-500' : 'bg-black hover:bg-gray-900'} text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-sm ${!loading ? 'hover:shadow-md' : ''}`}
              disabled={loading}
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