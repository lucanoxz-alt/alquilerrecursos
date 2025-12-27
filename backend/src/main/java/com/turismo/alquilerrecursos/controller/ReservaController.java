package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.dto.CancelacionReservaRequest;
import com.turismo.alquilerrecursos.dto.ReservaRequest;
import com.turismo.alquilerrecursos.model.Reserva;
import com.turismo.alquilerrecursos.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reserva")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @PostMapping
    public ResponseEntity<Reserva> crearReserva(@RequestBody ReservaRequest request) {
        Reserva nueva = reservaService.crearReserva(request); // ← Debe coincidir con el método público
        return ResponseEntity.ok(nueva);
    }

    @GetMapping
    public ResponseEntity<List<Reserva>> obtenerTodasLasReservas() {
        List<Reserva> reservas = reservaService.obtenerTodasLasReservas();
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/{idReserva}")
    public ResponseEntity<Reserva> obtenerReservaPorId(@PathVariable String idReserva) {
        Reserva reserva = reservaService.obtenerReservaPorId(idReserva);
        if (reserva != null) {
            return ResponseEntity.ok(reserva);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Reserva>> obtenerReservasPorEstado(@PathVariable String estado) {
        List<Reserva> reservas = reservaService.obtenerReservasPorEstado(estado);
        return ResponseEntity.ok(reservas);
    }

    @GetMapping("/turista/{idTurista}")
    public ResponseEntity<List<Reserva>> obtenerReservasPorTurista(@PathVariable String idTurista) {
        List<Reserva> reservas = reservaService.obtenerReservasPorTurista(idTurista);
        return ResponseEntity.ok(reservas);
    }

    @PutMapping("/{idReserva}/confirmar")
    public ResponseEntity<?> confirmarReserva(@PathVariable String idReserva) {
        try {
            var resp = reservaService.confirmarReserva(idReserva);
            return ResponseEntity.ok(resp);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{idReserva}/cancelar")
    public ResponseEntity<Reserva> cancelarReserva(
        @PathVariable String idReserva,
        @RequestBody CancelacionReservaRequest request) {
        Reserva cancelada = reservaService.cancelarReserva(idReserva, request);
        return ResponseEntity.ok(cancelada);
    }

}