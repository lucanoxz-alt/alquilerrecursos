// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Local backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token en cada petición
api.interceptors.request.use(
  (config) => {
    // Buscar token en múltiples ubicaciones para robustez
    const tryParse = (v) => { try { return JSON.parse(v); } catch { return null; } };

    let token = null;
    // 1) Storage claves comunes
    token = token || localStorage.getItem('authToken') || localStorage.getItem('token');
    token = token || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');

    // 2) Estructuras tipo userData
    const lsUser = tryParse(localStorage.getItem('userData')) || {};
    const ssUser = tryParse(sessionStorage.getItem('userData')) || {};
    token = token || lsUser.token || lsUser.accessToken || lsUser.jwt || lsUser.idToken;
    token = token || ssUser.token || ssUser.accessToken || ssUser.jwt || ssUser.idToken;

    const url = config.url || '';
    // No enviar Authorization en endpoints públicos de comprobantes
    const isPublicComprobante = /\/alquileres\/[^/]+\/(ticket|factura|xml)$/.test(url) || url.includes('/comprobantes-pago/');
    if (token && !isPublicComprobante) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas (ej: errores 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Evitar redirección automática al presionar botones en admin; deja que la UI maneje el error
      if (!error.config.url?.includes('/auth/login')) {
        console.warn('401 no autorizado en', error.config?.url);
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
      // El backend devuelve { recursosDisponibles: [...], ... }
      return response.data?.recursosDisponibles || [];
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

// Servicios para alquileres (extendido)
export const alquilerServiceExtended = {
  // Obtener todos los alquileres
  obtenerTodos: async () => {
    try {
      const response = await api.get('/alquileres');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alquileres:', error);
      throw error;
    }
  },

  // Obtener alquiler por ID
  obtenerPorId: async (idAlquiler) => {
    try {
      const response = await api.get(`/alquileres/${idAlquiler}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alquiler:', error);
      throw error;
    }
  },

  // Obtener alquileres por turista
  obtenerPorTurista: async (idTurista) => {
    try {
      const response = await api.get(`/alquileres/turista/${idTurista}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alquileres por turista:', error);
      throw error;
    }
  },

  // Obtener alquileres activos
  obtenerActivos: async () => {
    try {
      const response = await api.get('/alquileres/activos');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alquileres activos:', error);
      throw error;
    }
  }
};

// Servicios para reservas (extendido)
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

  // Obtener todas las reservas
  obtenerTodas: async () => {
    try {
      const response = await api.get('/reserva');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      throw error;
    }
  },

  // Obtener reserva por ID
  obtenerPorId: async (idReserva) => {
    try {
      const response = await api.get(`/reserva/${idReserva}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reserva:', error);
      throw error;
    }
  },

  // Obtener reservas por estado
  obtenerPorEstado: async (estado) => {
    try {
      const response = await api.get(`/reserva/estado/${estado}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reservas por estado:', error);
      throw error;
    }
  },

  // Confirmar reserva
  confirmar: async (idReserva) => {
    try {
      const response = await api.put(`/reserva/${idReserva}/confirmar`);
      return response.data;
    } catch (error) {
      console.error('Error confirmando reserva:', error);
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

// Servicios para turistas
export const turistaService = {
  // Crear turista
  crear: async (turistaData) => {
    try {
      const response = await api.post('/turistas', turistaData);
      return response.data;
    } catch (error) {
      console.error('Error creando turista:', error);
      throw error;
    }
  },

  // Obtener todos los turistas
  obtenerTodos: async () => {
    try {
      const response = await api.get('/turistas');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo turistas:', error);
      throw error;
    }
  },

  // Buscar turistas
  buscar: async (query) => {
    try {
      const response = await api.get('/turistas/buscar', { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Error buscando turistas:', error);
      throw error;
    }
  },

  // Obtener turista por ID
  obtenerPorId: async (idTurista) => {
    try {
      const response = await api.get(`/turistas/${idTurista}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo turista:', error);
      throw error;
    }
  },

  // Actualizar turista
  actualizar: async (idTurista, turistaData) => {
    try {
      const response = await api.put(`/turistas/${idTurista}`, turistaData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando turista:', error);
      throw error;
    }
  },

  // Eliminar turista
  eliminar: async (idTurista) => {
    try {
      await api.delete(`/turistas/${idTurista}`);
      return true;
    } catch (error) {
      console.error('Error eliminando turista:', error);
      throw error;
    }
  }
};

// Servicios para promociones
export const promocionService = {
  // Obtener todas las promociones
  obtenerTodas: async () => {
    try {
      const response = await api.get('/promociones');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo promociones:', error);
      throw error;
    }
  },

  // Obtener promociones activas
  obtenerActivas: async () => {
    try {
      const response = await api.get('/promociones/activas');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo promociones activas:', error);
      throw error;
    }
  },

  // Crear promoción
  crear: async (promocionData) => {
    try {
      const response = await api.post('/promociones', promocionData);
      return response.data;
    } catch (error) {
      console.error('Error creando promoción:', error);
      throw error;
    }
  },

  // Actualizar promoción
  actualizar: async (idPromocion, promocionData) => {
    try {
      const response = await api.put(`/promociones/${idPromocion}`, promocionData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando promoción:', error);
      throw error;
    }
  },

  // Eliminar promoción
  eliminar: async (idPromocion) => {
    try {
      await api.delete(`/promociones/${idPromocion}`);
      return true;
    } catch (error) {
      console.error('Error eliminando promoción:', error);
      throw error;
    }
  },

  // Activar/Desactivar promoción (toggle)
  toggle: async (idPromocion) => {
    try {
      const response = await api.put(`/promociones/${idPromocion}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling promoción:', error);
      throw error;
    }
  },

  // Buscar promociones
  buscar: async (query) => {
    try {
      const response = await api.get(`/promociones/buscar?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error buscando promociones:', error);
      throw error;
    }
  }
};

// Servicios para recursos
export const recursoService = {
  // Obtener todos los recursos
  obtenerTodos: async () => {
    try {
      const response = await api.get('/recursos');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo recursos:', error);
      throw error;
    }
  }
};

// Servicios para pagos
export const pagoService = {
  // Obtener resumen del día
  obtenerResumenHoy: async () => {
    try {
      const response = await api.get('/pagos/resumen/hoy');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen de pagos:', error);
      throw error;
    }
  }
};

export const getCurrentUserId = () => {
  // Try to get from userData in storage
  const tryParse = (v) => { try { return JSON.parse(v); } catch { return null; } };
  const lsUser = tryParse(localStorage.getItem('userData')) || tryParse(localStorage.getItem('user')) || {};
  const ssUser = tryParse(sessionStorage.getItem('userData')) || tryParse(sessionStorage.getItem('user')) || {};
  const userIdFromObj = lsUser.idUsuario || ssUser.idUsuario || lsUser.userId || ssUser.userId || lsUser.id || ssUser.id;
  if (userIdFromObj) return String(userIdFromObj);

  // Try to decode JWT from storages
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') ||
                sessionStorage.getItem('authToken') || sessionStorage.getItem('token') ||
                lsUser.token || lsUser.accessToken || ssUser.token || ssUser.accessToken || null;
  if (token && token.split('.').length === 3) {
    try {
      const payload = token.split('.')[1];
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      // Common claim keys
      return String(json.idUsuario || json.user_id || json.sub || json.uid || '');
    } catch {}
  }
  return '';
};

export default api;