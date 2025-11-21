package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.Recurso;
import com.turismo.alquilerrecursos.service.RecursoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/recursos")
public class RecursoController {

    @Autowired
    private RecursoService recursoService;

    @GetMapping
    public ResponseEntity<List<Recurso>> obtenerTodosLosRecursos() {
        List<Recurso> recursos = recursoService.obtenerTodosLosRecursos();
        return ResponseEntity.ok(recursos);
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Recurso>> obtenerRecursosDisponibles() {
        List<Recurso> recursos = recursoService.obtenerRecursosDisponibles();
        return ResponseEntity.ok(recursos);
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Recurso>> obtenerRecursosPorEstado(@PathVariable String estado) {
        List<Recurso> recursos = recursoService.obtenerRecursosPorEstado(estado);
        return ResponseEntity.ok(recursos);
    }

    @GetMapping("/tipo/{idTipo}")
    public ResponseEntity<List<Recurso>> obtenerRecursosPorTipo(@PathVariable String idTipo) {
        List<Recurso> recursos = recursoService.obtenerRecursosPorTipo(idTipo);
        return ResponseEntity.ok(recursos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recurso> obtenerRecursoPorId(@PathVariable String id) {
        Optional<Recurso> recurso = recursoService.obtenerRecursoPorId(id);
        return recurso.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Recurso>> buscarRecursos(@RequestParam String termino) {
        List<Recurso> recursos = recursoService.buscarRecursos(termino);
        return ResponseEntity.ok(recursos);
    }

    @PostMapping
    public ResponseEntity<?> crearRecurso(@RequestBody Recurso recurso) {
        try {
            Recurso nuevoRecurso = recursoService.crearRecurso(recurso);
            return ResponseEntity.ok(nuevoRecurso);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al crear recurso: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarRecurso(@PathVariable String id, @RequestBody Recurso recurso) {
        try {
            Recurso recursoActualizado = recursoService.actualizarRecurso(id, recurso);
            return ResponseEntity.ok(recursoActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al actualizar recurso: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstadoRecurso(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");
            if (nuevoEstado == null) {
                return ResponseEntity.badRequest().body("El campo 'estado' es requerido");
            }
            Recurso recursoActualizado = recursoService.cambiarEstadoRecurso(id, nuevoEstado);
            return ResponseEntity.ok(recursoActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarRecurso(@PathVariable String id) {
        try {
            boolean eliminado = recursoService.eliminarRecurso(id);
            if (eliminado) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<RecursoService.EstadisticasRecursos> obtenerEstadisticas() {
        RecursoService.EstadisticasRecursos estadisticas = recursoService.obtenerEstadisticasRecursos();
        return ResponseEntity.ok(estadisticas);
    }
}