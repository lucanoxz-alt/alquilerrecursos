package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.dto.AlquilerRequest;
import com.turismo.alquilerrecursos.model.Alquiler;
import com.turismo.alquilerrecursos.service.AlquilerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alquileres")
public class AlquilerController {

    @Autowired
    private AlquilerService alquilerService;

    @PostMapping
    public ResponseEntity<Alquiler> crearAlquiler(@RequestBody AlquilerRequest request) {
        Alquiler nuevoAlquiler = alquilerService.crearAlquiler(request);
        return ResponseEntity.ok(nuevoAlquiler);
    }

    @PutMapping("/{idAlquiler}/finalizar")
    public ResponseEntity<Alquiler> finalizarAlquiler(@PathVariable String idAlquiler) {
        Alquiler alquilerFinalizado = alquilerService.finalizarAlquiler(idAlquiler);
        return ResponseEntity.ok(alquilerFinalizado);
    }
}