package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DisponibilidadService {

    @Autowired
    private RecursoRepository recursoRepository;
    @Autowired
    private AlquilerRepository alquilerRepository;
    @Autowired
    private ReservaRepository reservaRepository;
    @Autowired
    private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired
    private DetalleReservaRepository detalleReservaRepository;

    /**
     * Verifica si un recurso específico está disponible en un rango de tiempo dado
     */
    public boolean verificarDisponibilidadRecurso(String idRecurso, LocalDateTime fechaInicio, int duracionHoras) {
        LocalDateTime fechaFin = fechaInicio.plusHours(duracionHoras);
        
        // Verificar que el recurso exista y esté disponible
        if (idRecurso == null) {
            return false;
        }
        Recurso recurso = recursoRepository.findById(idRecurso).orElse(null);
        if (recurso == null || !"Disponible".equals(recurso.getEstado())) {
            return false;
        }

        // Verificar conflictos con alquileres activos
        boolean conflictoAlquileres = verificarConflictoAlquileres(idRecurso, fechaInicio, fechaFin);
        
        // Verificar conflictos con reservas pendientes
        boolean conflictoReservas = verificarConflictoReservas(idRecurso, fechaInicio, fechaFin);
        
        return !conflictoAlquileres && !conflictoReservas;
    }

    /**
     * Verifica conflictos con alquileres activos
     */
    private boolean verificarConflictoAlquileres(String idRecurso, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        // Buscar alquileres activos que involucren este recurso
        List<Alquiler> alquileresActivos = alquilerRepository.findByEstadoalquiler("Activo");
        
        for (Alquiler alquiler : alquileresActivos) {
            // Verificar si este alquiler tiene el recurso en cuestión
            List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(alquiler.getIdAlquiler());
            boolean tieneRecurso = detalles.stream()
                .anyMatch(detalle -> idRecurso.equals(detalle.getIdRecurso()));
            
            if (tieneRecurso) {
                LocalDateTime inicioAlquiler = alquiler.getFechaHoraInicio();
                LocalDateTime finAlquiler = alquiler.getFechaHoraFin();
                
                // Verificar si hay solapamiento de horarios
                if (hayConflictoHorario(fechaInicio, fechaFin, inicioAlquiler, finAlquiler)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Verifica conflictos con reservas pendientes
     */
    private boolean verificarConflictoReservas(String idRecurso, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        // Buscar reservas pendientes que involucren este recurso
        List<Reserva> reservasPendientes = reservaRepository.findByEstadoreserva("Pendiente");
        
        for (Reserva reserva : reservasPendientes) {
            // Verificar si esta reserva tiene el recurso en cuestión
            List<DetalleReserva> detalles = detalleReservaRepository.findByIdReserva(reserva.getIdReserva());
            
            for (DetalleReserva detalle : detalles) {
                if (idRecurso.equals(detalle.getIdRecurso())) {
                    LocalDateTime inicioReserva = reserva.getFechaHoraInicioPrevista();
                    LocalDateTime finReserva = inicioReserva.plusHours(detalle.getHorasSolicitadas());
                    
                    // Verificar si hay solapamiento de horarios
                    if (hayConflictoHorario(fechaInicio, fechaFin, inicioReserva, finReserva)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Verifica si dos rangos de tiempo se superponen
     */
    private boolean hayConflictoHorario(LocalDateTime inicio1, LocalDateTime fin1, 
                                       LocalDateTime inicio2, LocalDateTime fin2) {
        // Dos rangos se superponen si:
        // inicio1 < fin2 && inicio2 < fin1
        return inicio1.isBefore(fin2) && inicio2.isBefore(fin1);
    }

    /**
     * Obtiene todos los recursos disponibles en un rango de tiempo
     */
    public List<Recurso> obtenerRecursosDisponibles(LocalDateTime fechaInicio, int duracionHoras) {
        List<Recurso> todosLosRecursos = recursoRepository.findByEstado("Disponible");
        
        return todosLosRecursos.stream()
            .filter(recurso -> verificarDisponibilidadRecurso(recurso.getIdRecurso(), fechaInicio, duracionHoras))
            .collect(Collectors.toList());
    }

    /**
     * Verifica disponibilidad para múltiples recursos
     */
    public boolean verificarDisponibilidadMultiple(List<String> idsRecursos, LocalDateTime fechaInicio, int duracionHoras) {
        return idsRecursos.stream()
            .allMatch(idRecurso -> verificarDisponibilidadRecurso(idRecurso, fechaInicio, duracionHoras));
    }

    /**
     * Obtiene información detallada de conflictos para un recurso
     */
    public String obtenerDetalleConflicto(String idRecurso, LocalDateTime fechaInicio, int duracionHoras) {
        LocalDateTime fechaFin = fechaInicio.plusHours(duracionHoras);
        
        // Verificar estado del recurso
        if (idRecurso == null) {
            return "ID de recurso es null";
        }
        Recurso recurso = recursoRepository.findById(idRecurso).orElse(null);
        if (recurso == null) {
            return "Recurso no encontrado";
        }
        if (!"Disponible".equals(recurso.getEstado())) {
            return "Recurso no disponible (Estado: " + recurso.getEstado() + ")";
        }

        // Verificar conflictos específicos
        if (verificarConflictoAlquileres(idRecurso, fechaInicio, fechaFin)) {
            return "Recurso ya alquilado en ese horario";
        }
        
        if (verificarConflictoReservas(idRecurso, fechaInicio, fechaFin)) {
            return "Recurso ya reservado en ese horario";
        }
        
        return "Disponible";
    }
}