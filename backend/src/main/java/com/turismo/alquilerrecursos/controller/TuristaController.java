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
    
}