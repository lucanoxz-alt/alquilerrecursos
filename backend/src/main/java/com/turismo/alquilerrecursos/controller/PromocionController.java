package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.Promocion;
import com.turismo.alquilerrecursos.service.PromocionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/promociones")
public class PromocionController {

    @Autowired
    private PromocionService promocionService;

    /**
     * Obtener todas las promociones
     */
    @GetMapping
    public ResponseEntity<List<Promocion>> obtenerTodasLasPromociones() {
        List<Promocion> promociones = promocionService.obtenerTodasLasPromociones();
        return ResponseEntity.ok(promociones);
    }

    /**
     * Obtener promociones activas
     */
    @GetMapping("/activas")
    public ResponseEntity<List<Promocion>> obtenerPromocionesActivas() {
        List<Promocion> promociones = promocionService.obtenerPromocionesActivas();
        return ResponseEntity.ok(promociones);
    }

    /**
     * Obtener promoción por ID
     */
    @GetMapping("/{idPromocion}")
    public ResponseEntity<Promocion> obtenerPromocionPorId(@PathVariable String idPromocion) {
        Optional<Promocion> promocion = promocionService.obtenerPromocionPorId(idPromocion);
        return promocion.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Crear nueva promoción
     */
    @PostMapping
    public ResponseEntity<?> crearPromocion(@RequestBody Promocion promocion) {
        try {
            Promocion nuevaPromocion = promocionService.crearPromocion(promocion);
            return ResponseEntity.ok(nuevaPromocion);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al crear promoción: " + e.getMessage());
        }
    }

    /**
     * Actualizar promoción existente
     */
    @PutMapping("/{idPromocion}")
    public ResponseEntity<?> actualizarPromocion(
            @PathVariable String idPromocion,
            @RequestBody Promocion promocion) {
        try {
            Promocion promocionActualizada = promocionService.actualizarPromocion(idPromocion, promocion);
            return ResponseEntity.ok(promocionActualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al actualizar promoción: " + e.getMessage());
        }
    }

    /**
     * Eliminar promoción
     */
    @DeleteMapping("/{idPromocion}")
    public ResponseEntity<?> eliminarPromocion(@PathVariable String idPromocion) {
        boolean eliminado = promocionService.eliminarPromocion(idPromocion);
        if (eliminado) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Activar/Desactivar promoción
     */
    @PutMapping("/{idPromocion}/toggle")
    public ResponseEntity<?> toggleEstadoPromocion(@PathVariable String idPromocion) {
        try {
            Promocion promocion = promocionService.toggleEstadoPromocion(idPromocion);
            return ResponseEntity.ok(promocion);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Obtener promociones válidas para una fecha
     */
    @GetMapping("/validas-para-fecha")
    public ResponseEntity<List<Promocion>> obtenerPromocionesValidasParaFecha(
            @RequestParam String fecha) {
        try {
            LocalDate fechaConsulta = LocalDate.parse(fecha);
            List<Promocion> promociones = promocionService.obtenerPromocionesValidasParaFecha(fechaConsulta);
            return ResponseEntity.ok(promociones);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Verificar si una promoción es válida
     */
    @GetMapping("/{idPromocion}/es-valida")
    public ResponseEntity<Boolean> esPromocionValida(
            @PathVariable String idPromocion,
            @RequestParam(required = false) String fecha) {
        try {
            LocalDate fechaConsulta = fecha != null ? LocalDate.parse(fecha) : LocalDate.now();
            boolean esValida = promocionService.esPromocionValida(idPromocion, fechaConsulta);
            return ResponseEntity.ok(esValida);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}