package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.Pago;
import com.turismo.alquilerrecursos.model.PagoReserva;
import com.turismo.alquilerrecursos.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    /**
     * Obtener todos los pagos de alquileres
     */
    @GetMapping("/alquileres")
    public ResponseEntity<List<Pago>> obtenerTodosLosPagosAlquileres() {
        List<Pago> pagos = pagoService.obtenerTodosLosPagos();
        return ResponseEntity.ok(pagos);
    }

    /**
     * Obtener pago por ID de alquiler
     */
    @GetMapping("/alquiler/{idAlquiler}")
    public ResponseEntity<Pago> obtenerPagoPorIdAlquiler(@PathVariable String idAlquiler) {
        Pago pago = pagoService.obtenerPagoPorIdAlquiler(idAlquiler);
        if (pago != null) {
            return ResponseEntity.ok(pago);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtener todos los pagos de reservas
     */
    @GetMapping("/reservas")
    public ResponseEntity<List<PagoReserva>> obtenerTodosLosPagosReservas() {
        List<PagoReserva> pagos = pagoService.obtenerTodosLosPagosReserva();
        return ResponseEntity.ok(pagos);
    }

    /**
     * Obtener pagos de reserva por ID de reserva
     */
    @GetMapping("/reserva/{idReserva}")
    public ResponseEntity<List<PagoReserva>> obtenerPagosReservaPorId(@PathVariable String idReserva) {
        List<PagoReserva> pagos = pagoService.obtenerPagosReservaPorIdReserva(idReserva);
        return ResponseEntity.ok(pagos);
    }

    /**
     * Crear pago adicional para un alquiler
     */
    @PostMapping("/alquiler/{idAlquiler}/adicional")
    public ResponseEntity<?> crearPagoAdicional(
            @PathVariable String idAlquiler,
            @RequestBody Map<String, Object> request) {
        try {
            BigDecimal monto = new BigDecimal(request.get("monto").toString());
            String metodoPago = request.get("metodoPago").toString();
            String concepto = request.getOrDefault("concepto", "Pago adicional").toString();
            
            Pago pago = pagoService.crearPagoAdicional(idAlquiler, monto, metodoPago, concepto);
            return ResponseEntity.ok(pago);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear pago adicional: " + e.getMessage());
        }
    }

    /**
     * Crear devolución por cancelación de reserva
     */
    @PostMapping("/reserva/{idReserva}/devolucion")
    public ResponseEntity<?> crearDevolucion(
            @PathVariable String idReserva,
            @RequestBody Map<String, Object> request) {
        try {
            BigDecimal montoDevolucion = new BigDecimal(request.get("montoDevolucion").toString());
            String motivoDevolucion = request.getOrDefault("motivoDevolucion", "Cancelación de reserva").toString();
            
            PagoReserva devolucion = pagoService.crearDevolucion(idReserva, montoDevolucion, motivoDevolucion);
            return ResponseEntity.ok(devolucion);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear devolución: " + e.getMessage());
        }
    }

    /**
     * Obtener historial de pagos por turista
     */
    @GetMapping("/turista/{idTurista}")
    public ResponseEntity<List<Pago>> obtenerHistorialPagosPorTurista(@PathVariable String idTurista) {
        List<Pago> pagos = pagoService.obtenerHistorialPagosPorTurista(idTurista);
        return ResponseEntity.ok(pagos);
    }

    /**
     * Calcular total pagado por un turista
     */
    @GetMapping("/turista/{idTurista}/total")
    public ResponseEntity<Map<String, Object>> calcularTotalPagadoPorTurista(@PathVariable String idTurista) {
        BigDecimal total = pagoService.calcularTotalPagadoPorTurista(idTurista);
        Map<String, Object> response = Map.of(
            "idTurista", idTurista,
            "totalPagado", total
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Obtener resumen de pagos del día
     */
    @GetMapping("/resumen/hoy")
    public ResponseEntity<Map<String, Object>> obtenerResumenPagosDelDia() {
        BigDecimal totalDelDia = pagoService.obtenerTotalPagosDelDia();
        Map<String, Object> response = Map.of(
            "fecha", java.time.LocalDate.now(),
            "totalPagos", totalDelDia
        );
        return ResponseEntity.ok(response);
    }
}