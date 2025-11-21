package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.Recurso;
import com.turismo.alquilerrecursos.service.DisponibilidadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disponibilidad")
public class DisponibilidadController {

    @Autowired
    private DisponibilidadService disponibilidadService;

    /**
     * Verificar disponibilidad de un recurso específico
     * GET /api/disponibilidad/recurso/{idRecurso}?fechaInicio=2024-01-15T10:00:00&duracionHoras=2
     */
    @GetMapping("/recurso/{idRecurso}")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidadRecurso(
            @PathVariable String idRecurso,
            @RequestParam String fechaInicio,
            @RequestParam int duracionHoras) {
        
        LocalDateTime fecha = LocalDateTime.parse(fechaInicio);
        boolean disponible = disponibilidadService.verificarDisponibilidadRecurso(idRecurso, fecha, duracionHoras);
        String detalle = disponibilidadService.obtenerDetalleConflicto(idRecurso, fecha, duracionHoras);
        
        Map<String, Object> response = new HashMap<>();
        response.put("disponible", disponible);
        response.put("idRecurso", idRecurso);
        response.put("detalle", detalle);
        response.put("fechaInicio", fechaInicio);
        response.put("duracionHoras", duracionHoras);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Obtener todos los recursos disponibles para un horario
     * GET /api/disponibilidad/recursos?fechaInicio=2024-01-15T10:00:00&duracionHoras=2
     */
    @GetMapping("/recursos")
    public ResponseEntity<Map<String, Object>> obtenerRecursosDisponibles(
            @RequestParam String fechaInicio,
            @RequestParam int duracionHoras) {
        
        LocalDateTime fecha = LocalDateTime.parse(fechaInicio);
        List<Recurso> recursosDisponibles = disponibilidadService.obtenerRecursosDisponibles(fecha, duracionHoras);
        
        Map<String, Object> response = new HashMap<>();
        response.put("recursosDisponibles", recursosDisponibles);
        response.put("fechaInicio", fechaInicio);
        response.put("duracionHoras", duracionHoras);
        response.put("totalDisponibles", recursosDisponibles.size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Verificar disponibilidad para múltiples recursos
     * POST /api/disponibilidad/verificar-multiple
     */
    @PostMapping("/verificar-multiple")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidadMultiple(
            @RequestBody VerificarMultipleRequest request) {
        
        LocalDateTime fecha = LocalDateTime.parse(request.getFechaInicio());
        boolean disponible = disponibilidadService.verificarDisponibilidadMultiple(
            request.getIdsRecursos(), fecha, request.getDuracionHoras());
        
        // Obtener detalles para cada recurso
        Map<String, String> detallesPorRecurso = new HashMap<>();
        for (String idRecurso : request.getIdsRecursos()) {
            String detalle = disponibilidadService.obtenerDetalleConflicto(idRecurso, fecha, request.getDuracionHoras());
            detallesPorRecurso.put(idRecurso, detalle);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("todosDisponibles", disponible);
        response.put("detallesPorRecurso", detallesPorRecurso);
        response.put("fechaInicio", request.getFechaInicio());
        response.put("duracionHoras", request.getDuracionHoras());
        
        return ResponseEntity.ok(response);
    }

    /**
     * DTO para verificación múltiple
     */
    public static class VerificarMultipleRequest {
        private List<String> idsRecursos;
        private String fechaInicio;
        private int duracionHoras;

        // Getters y setters
        public List<String> getIdsRecursos() { return idsRecursos; }
        public void setIdsRecursos(List<String> idsRecursos) { this.idsRecursos = idsRecursos; }

        public String getFechaInicio() { return fechaInicio; }
        public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }

        public int getDuracionHoras() { return duracionHoras; }
        public void setDuracionHoras(int duracionHoras) { this.duracionHoras = duracionHoras; }
    }
}