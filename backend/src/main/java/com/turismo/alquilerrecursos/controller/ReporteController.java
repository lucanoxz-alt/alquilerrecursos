package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

    /**
     * Dashboard con métricas generales
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> obtenerDashboard() {
        Map<String, Object> dashboard = reporteService.obtenerDashboard();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Historial de alquileres por turista
     */
    @GetMapping("/historial-turista/{idTurista}")
    public ResponseEntity<Map<String, Object>> obtenerHistorialTurista(@PathVariable String idTurista) {
        Map<String, Object> historial = reporteService.obtenerHistorialTurista(idTurista);
        return ResponseEntity.ok(historial);
    }

    /**
     * Recursos más alquilados
     */
    @GetMapping("/recursos-populares")
    public ResponseEntity<Map<String, Object>> obtenerRecursosMasAlquilados() {
        Map<String, Object> recursos = reporteService.obtenerRecursosMasAlquilados();
        return ResponseEntity.ok(recursos);
    }

    /**
     * Tasa de cancelación con motivos
     */
    @GetMapping("/tasa-cancelacion")
    public ResponseEntity<Map<String, Object>> obtenerTasaCancelacion() {
        Map<String, Object> cancelaciones = reporteService.obtenerTasaCancelacion();
        return ResponseEntity.ok(cancelaciones);
    }

    /**
     * Ingresos diferenciando operaciones con/sin promociones
     */
    @GetMapping("/ingresos")
    public ResponseEntity<Map<String, Object>> obtenerReporteIngresos(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {
        
        LocalDateTime inicio = fechaInicio != null ? LocalDateTime.parse(fechaInicio) : null;
        LocalDateTime fin = fechaFin != null ? LocalDateTime.parse(fechaFin) : null;
        
        Map<String, Object> ingresos = reporteService.obtenerReporteIngresos(inicio, fin);
        return ResponseEntity.ok(ingresos);
    }

    /**
     * Consulta específica: ¿Quién alquiló qué recurso a un turista?
     */
    @GetMapping("/quien-alquilo-que")
    public ResponseEntity<Map<String, Object>> obtenerQuienAlquiloQue(
            @RequestParam(required = false) String idTurista,
            @RequestParam(required = false) String idRecurso) {
        
        Map<String, Object> resultado = reporteService.obtenerQuienAlquiloQue(idTurista, idRecurso);
        return ResponseEntity.ok(resultado);
    }

    /**
     * Reporte de estado actual de recursos
     */
    @GetMapping("/estado-recursos")
    public ResponseEntity<Map<String, Object>> obtenerEstadoRecursos() {
        Map<String, Object> estadoRecursos = reporteService.obtenerEstadoRecursos();
        return ResponseEntity.ok(estadoRecursos);
    }

    /**
     * Reporte de reservas pendientes
     */
    @GetMapping("/reservas-pendientes")
    public ResponseEntity<Map<String, Object>> obtenerReservasPendientes() {
        Map<String, Object> reservasPendientes = reporteService.obtenerReservasPendientes();
        return ResponseEntity.ok(reservasPendientes);
    }

    /**
     * Resumen diario por usuario (gestor)
     * - Administradores y Jefes pueden solicitar para cualquier gestor
     * - Empleados solo pueden solicitar su propio resumen (enforced via UsuarioSecurity.isSelf)
     */
    @GetMapping("/diario-usuario")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','JEFE') or @usuarioSecurity.isSelf(#idUsuarioGestor)")
    public ResponseEntity<Map<String, Object>> obtenerResumenDiarioPorUsuario(
            @RequestParam String idUsuarioGestor,
            @RequestParam(required = false) String fecha) {

        LocalDate dia = (fecha != null) ? LocalDate.parse(fecha) : LocalDate.now();
        Map<String, Object> resumen = reporteService.obtenerResumenDiarioPorUsuario(idUsuarioGestor, dia);
        return ResponseEntity.ok(resumen);
    }

    /**
     * Reporte financiero detallado
     */
    @GetMapping("/financiero")
    public ResponseEntity<Map<String, Object>> obtenerReporteFinanciero(
            @RequestParam(required = false) String periodo) { // "mes", "año", "semana"
        
        Map<String, Object> reporteFinanciero = reporteService.obtenerReporteFinanciero(periodo);
        return ResponseEntity.ok(reporteFinanciero);
    }

    /**
     * Caja diaria (cuadre de caja)
     */
    @GetMapping("/caja-diaria")
    public ResponseEntity<Map<String, Object>> obtenerCajaDiaria(
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String idUsuarioGestor) {
        java.time.LocalDate dia = (fecha != null && !fecha.isBlank()) ? java.time.LocalDate.parse(fecha) : java.time.LocalDate.now();
        Map<String, Object> data = reporteService.obtenerCajaDiaria(dia, idUsuarioGestor);
        return ResponseEntity.ok(data);
    }

    /**
     * Ingresos por medio de pago en un rango
     */
    @GetMapping("/ingresos-por-medio")
    public ResponseEntity<Map<String, Object>> obtenerIngresosPorMedio(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {
        java.time.LocalDateTime inicio = fechaInicio != null ? java.time.LocalDateTime.parse(fechaInicio) : null;
        java.time.LocalDateTime fin = fechaFin != null ? java.time.LocalDateTime.parse(fechaFin) : null;
        Map<String, Object> data = reporteService.obtenerIngresosPorMedio(inicio, fin);
        return ResponseEntity.ok(data);
    }

    /**
     * Alquileres por usuario gestor en un rango
     */
    @GetMapping("/alquileres-por-usuario")
    public ResponseEntity<Map<String, Object>> obtenerAlquileresPorUsuario(
            @RequestParam String idUsuarioGestor,
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {
        java.time.LocalDateTime inicio = fechaInicio != null ? java.time.LocalDateTime.parse(fechaInicio) : null;
        java.time.LocalDateTime fin = fechaFin != null ? java.time.LocalDateTime.parse(fechaFin) : null;
        Map<String, Object> data = reporteService.obtenerAlquileresPorUsuario(inicio, fin, idUsuarioGestor);
        return ResponseEntity.ok(data);
    }
}