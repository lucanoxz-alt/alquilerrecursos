package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Recurso;
import com.turismo.alquilerrecursos.repository.RecursoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class RecursoService {

    @Autowired
    private RecursoRepository recursoRepository;

    /**
     * Obtener todos los recursos
     */
    public List<Recurso> obtenerTodosLosRecursos() {
        return recursoRepository.findAll();
    }

    /**
     * Obtener recursos por estado
     */
    public List<Recurso> obtenerRecursosPorEstado(String estado) {
        return recursoRepository.findByEstado(estado);
    }

    /**
     * Obtener recursos disponibles
     */
    public List<Recurso> obtenerRecursosDisponibles() {
        return recursoRepository.findByEstado("Disponible");
    }

    /**
     * Obtener recurso por ID
     */
    public Optional<Recurso> obtenerRecursoPorId(String idRecurso) {
        return recursoRepository.findById(idRecurso);
    }

    /**
     * Obtener recursos por tipo
     */
    public List<Recurso> obtenerRecursosPorTipo(String idTipo) {
        return recursoRepository.findByIdTipo(idTipo);
    }

    /**
     * Crear nuevo recurso
     */
    @Transactional
    public Recurso crearRecurso(Recurso recurso) {
        // Generar ID automático si no existe
        if (recurso.getIdRecurso() == null || recurso.getIdRecurso().isEmpty()) {
            String ultimoId = obtenerUltimoIdRecurso();
            if (ultimoId == null) {
                recurso.setIdRecurso("REC001");
            } else {
                int numero = Integer.parseInt(ultimoId.substring(3));
                numero++;
                recurso.setIdRecurso(String.format("REC%03d", numero));
            }
        }

        // Validaciones
        if (recurso.getNombre() == null || recurso.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre del recurso es obligatorio");
        }

        if (recurso.getTarifaHora() == null || recurso.getTarifaHora().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("La tarifa por hora debe ser mayor a 0");
        }

        // Estado por defecto
        if (recurso.getEstado() == null || recurso.getEstado().trim().isEmpty()) {
            recurso.setEstado("Disponible");
        }

        return recursoRepository.save(recurso);
    }

    /**
     * Actualizar recurso existente
     */
    @Transactional
    public Recurso actualizarRecurso(String idRecurso, Recurso recursoActualizado) {
        return recursoRepository.findById(idRecurso)
                .map(recurso -> {
                    recurso.setNombre(recursoActualizado.getNombre());
                    recurso.setDescripcion(recursoActualizado.getDescripcion());
                    recurso.setTarifaHora(recursoActualizado.getTarifaHora());
                    recurso.setUbicacion(recursoActualizado.getUbicacion());
                    recurso.setIdTipo(recursoActualizado.getIdTipo());
                    // No permitir cambio directo de estado aquí, usar métodos específicos
                    return recursoRepository.save(recurso);
                })
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
    }

    /**
     * Eliminar recurso
     */
    @Transactional
    public boolean eliminarRecurso(String idRecurso) {
        Optional<Recurso> recursoOpt = recursoRepository.findById(idRecurso);
        if (recursoOpt.isPresent()) {
            Recurso recurso = recursoOpt.get();
            // Solo permitir eliminar si está disponible
            if (!"Disponible".equalsIgnoreCase(recurso.getEstado())) {
                throw new RuntimeException("No se puede eliminar un recurso que no está disponible");
            }
            recursoRepository.deleteById(idRecurso);
            return true;
        }
        return false;
    }

    /**
     * Cambiar estado de recurso
     */
    @Transactional
    public Recurso cambiarEstadoRecurso(String idRecurso, String nuevoEstado) {
        return recursoRepository.findById(idRecurso)
                .map(recurso -> {
                    // Validar estados permitidos
                    if (!esEstadoValido(nuevoEstado)) {
                        throw new RuntimeException("Estado no válido: " + nuevoEstado);
                    }
                    recurso.setEstado(normalizarEstado(nuevoEstado));
                    return recursoRepository.save(recurso);
                })
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
    }

    /**
     * Buscar recursos por nombre o descripción
     */
    public List<Recurso> buscarRecursos(String termino) {
        return recursoRepository.buscarPorNombreOrDescripcion(termino);
    }

    /**
     * Obtener estadísticas de recursos
     */
    public EstadisticasRecursos obtenerEstadisticasRecursos() {
        List<Recurso> todos = recursoRepository.findAll();
        long disponibles = todos.stream().filter(r -> "Disponible".equals(r.getEstado())).count();
        long alquilados = todos.stream().filter(r -> "Alquilado".equals(r.getEstado())).count();
        long reservados = todos.stream().filter(r -> "Reservado".equals(r.getEstado())).count();
        long mantenimiento = todos.stream().filter(r -> "Mantenimiento".equals(r.getEstado())).count();

        return new EstadisticasRecursos(todos.size(), disponibles, alquilados, reservados, mantenimiento);
    }

    /**
     * Método auxiliar para validar estados
     */
    private boolean esEstadoValido(String estado) {
        if (estado == null) return false;
        String e = estado.trim().toLowerCase();
        return e.equals("disponible") || e.equals("alquilado") || e.equals("reservado") || e.equals("mantenimiento") || e.equals("fuera de servicio") || e.equals("fuera_servicio");
    }

    private String normalizarEstado(String estado) {
        if (estado == null) return "Disponible";
        String e = estado.trim().toLowerCase();
        switch (e) {
            case "disponible": return "Disponible";
            case "alquilado": return "Alquilado";
            case "reservado": return "Reservado";
            case "mantenimiento": return "Mantenimiento";
            case "fuera de servicio":
            case "fuera_servicio": return "Fuera de Servicio";
            default: return "Disponible";
        }
    }

    /**
     * Método auxiliar para obtener el último ID
     */
    private String obtenerUltimoIdRecurso() {
        List<Recurso> recursos = recursoRepository.findAll();
        if (recursos.isEmpty()) {
            return null;
        }
        return recursos.stream()
                .map(Recurso::getIdRecurso)
                .max(String::compareTo)
                .orElse(null);
    }

    /**
     * Clase interna para estadísticas
     */
    public static class EstadisticasRecursos {
        private final long total;
        private final long disponibles;
        private final long alquilados;
        private final long reservados;
        private final long mantenimiento;

        public EstadisticasRecursos(long total, long disponibles, long alquilados, long reservados, long mantenimiento) {
            this.total = total;
            this.disponibles = disponibles;
            this.alquilados = alquilados;
            this.reservados = reservados;
            this.mantenimiento = mantenimiento;
        }

        // Getters
        public long getTotal() { return total; }
        public long getDisponibles() { return disponibles; }
        public long getAlquilados() { return alquilados; }
        public long getReservados() { return reservados; }
        public long getMantenimiento() { return mantenimiento; }
    }
}