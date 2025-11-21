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
      // Solo limpiar tokens si NO estamos en el endpoint de login
      if (!error.config.url?.includes('/auth/login')) {
        const currentPath = window.location.pathname;
        const isMaintenancePage = currentPath.includes('/admin/mantenimiento/');
        
        // Si estamos en páginas de mantenimiento, solo loguear sin redireccionar
        if (isMaintenancePage) {
          console.warn('Endpoint no disponible o sin permisos:', error.config?.url);
        } else {
          console.error('Token inválido o expirado. Limpiando sesión.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          // Redirigir a login solo si no estamos ya en login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Servicios específicos para disponibilidad
export const disponibilidadService = {
  // Verificar disponibilidad de un recurso específico
  verificarRecurso: async (idRecurso, fechaInicio, duracionHoras) => {
    try {
      const response = await api.get(`/disponibilidad/recurso/${idRecurso}`, {
        params: { fechaInicio, duracionHoras }
      });
      return response.data;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      throw error;
    }
  },

  // Obtener todos los recursos disponibles
  obtenerRecursosDisponibles: async (fechaInicio, duracionHoras) => {
    try {
      const response = await api.get('/disponibilidad/recursos', {
        params: { fechaInicio, duracionHoras }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo recursos disponibles:', error);
      throw error;
    }
  },

  // Verificar disponibilidad múltiple
  verificarMultiple: async (idsRecursos, fechaInicio, duracionHoras) => {
    try {
      const response = await api.post('/disponibilidad/verificar-multiple', {
        idsRecursos,
        fechaInicio,
        duracionHoras
      });
      return response.data;
    } catch (error) {
      console.error('Error verificando disponibilidad múltiple:', error);
      throw error;
    }
  }
};

// Servicios para alquileres
export const alquilerService = {
  // Crear alquiler
  crear: async (alquilerData) => {
    try {
      const response = await api.post('/alquileres', alquilerData);
      return response.data;
    } catch (error) {
      console.error('Error creando alquiler:', error);
      throw error;
    }
  },

  // Finalizar alquiler
  finalizar: async (idAlquiler) => {
    try {
      const response = await api.put(`/alquileres/${idAlquiler}/finalizar`);
      return response.data;
    } catch (error) {
      console.error('Error finalizando alquiler:', error);
      throw error;
    }
  }
};

// Servicios para reservas
export const reservaService = {
  // Crear reserva
  crear: async (reservaData) => {
    try {
      const response = await api.post('/reserva', reservaData);
      return response.data;
    } catch (error) {
      console.error('Error creando reserva:', error);
      throw error;
    }
  },

  // Cancelar reserva
  cancelar: async (idReserva, motivoCancelacion, idUsuarioCancelacion) => {
    try {
      const response = await api.put(`/reserva/${idReserva}/cancelar`, {
        motivoCancelacion,
        idUsuarioCancelacion
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      throw error;
    }
  }
};

export default api;