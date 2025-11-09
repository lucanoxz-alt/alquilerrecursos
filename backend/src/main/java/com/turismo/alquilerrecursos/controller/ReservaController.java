package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.dto.CancelacionReservaRequest;
import com.turismo.alquilerrecursos.dto.ReservaRequest;
import com.turismo.alquilerrecursos.model.Reserva;
import com.turismo.alquilerrecursos.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PutMapping("/{idReserva}/cancelar")
    public ResponseEntity<Reserva> cancelarReserva(
        @PathVariable String idReserva,
        @RequestBody CancelacionReservaRequest request) {
        Reserva cancelada = reservaService.cancelarReserva(idReserva, request);
        return ResponseEntity.ok(cancelada);
    }

}