// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // <-- Asegúrate que coincida con el nombre que guardas
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas (ej: errores 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Token inválido o expirado. Redirigiendo a login.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Aquí puedes usar navigate() si estás dentro de un componente con Router
      // o redirigir manualmente window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;