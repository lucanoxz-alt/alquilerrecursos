// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api'; // Usando el alias '@' definido en vite.config.js

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 👇 NO pongas "/api/auth/login", porque api ya tiene baseURL con /api
      const response = await api.post('/auth/login', {
        username,
        password
      });

      // El backend ahora devuelve SOLO el token como string
      // response.data es el token JWT puro
      const token = response.data;

      // Guarda el token en localStorage
      localStorage.setItem('authToken', token);

      // Redirige al dashboard (asegúrate de que esta ruta exista)
      navigate('/admin'); // O '/main-dashboard' si esa es la ruta correcta para el usuario logueado
    } catch (error) {
      console.error("Error en login:", error.response?.data || error.message);
      alert("Usuario o contraseña incorrectos, o el servidor no responde.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold text-center mb-6">Sistema SGART</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-3 w-full mb-3 rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 w-full mb-4 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 w-full rounded font-semibold"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
};

export default Login;