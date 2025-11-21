// src/main/java/com/turismo/alquilerrecursos/controller/TuristaController.java
package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.Turista;
import com.turismo.alquilerrecursos.service.TuristaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/turistas")
public class TuristaController {

    @Autowired
    private TuristaService turistaService;

    @PostMapping
    public ResponseEntity<?> crearTurista(@RequestBody Turista nuevoTurista) {
        try {
            Turista turistaGuardado = turistaService.save(nuevoTurista);
            return ResponseEntity.ok(turistaGuardado);
        } catch (Exception e) {
            // Manejo genérico de otros errores
            return ResponseEntity.badRequest().body("Error al guardar el cliente: " + e.getMessage());
        }
    }

    // Método para manejar errores de validación
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((org.springframework.validation.FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(errors); // Devuelve un JSON con los errores
    }

    // Método para manejar errores internos
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleInternalServerErrors(Exception e) {
        // Loguear el error para debugging
        e.printStackTrace();
        return ResponseEntity.status(500).body("Error interno del servidor: " + e.getMessage());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Turista>> buscarPorNombreODni(@RequestParam String query) {
        List<Turista> resultados = turistaService.buscarPorNombreODni(query);
        return ResponseEntity.ok(resultados);
    }

    @GetMapping
    public ResponseEntity<List<Turista>> obtenerTodosLosClientes() {
        try {
            List<Turista> clientes = turistaService.findAll();
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Turista> obtenerClientePorId(@PathVariable String id) {
        if (id == null || id.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Turista cliente = turistaService.findById(id);
            if (cliente != null) {
                return ResponseEntity.ok(cliente);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCliente(@PathVariable String id, @RequestBody Turista turista) {
        if (id == null || id.isEmpty() || turista == null) {
            return ResponseEntity.badRequest().body("Datos inválidos");
        }
        try {
            turista.setIdTurista(id); // Asegurar que el ID sea correcto
            Turista clienteActualizado = turistaService.update(turista);
            if (clienteActualizado != null) {
                return ResponseEntity.ok(clienteActualizado);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al actualizar cliente: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCliente(@PathVariable String id) {
        if (id == null || id.isEmpty()) {
            return ResponseEntity.badRequest().body("ID inválido");
        }
        try {
            boolean eliminado = turistaService.deleteById(id);
            if (eliminado) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar cliente: " + e.getMessage());
        }
    }
    
}