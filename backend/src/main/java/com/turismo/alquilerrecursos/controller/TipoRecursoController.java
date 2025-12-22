package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.TipoRecurso;
import com.turismo.alquilerrecursos.repository.TipoRecursoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-recursos")
public class TipoRecursoController {

    @Autowired
    private TipoRecursoRepository tipoRecursoRepository;

    @GetMapping
    public ResponseEntity<List<TipoRecurso>> obtenerTodosTipos() {
        List<TipoRecurso> tipos = tipoRecursoRepository.findAll();
        return ResponseEntity.ok(tipos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoRecurso> obtenerTipoPorId(@PathVariable String id) {
        if (id == null || id.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return tipoRecursoRepository.findById(id)
                .map(tipo -> ResponseEntity.ok().body(tipo))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearTipo(@RequestBody TipoRecurso tipoRecurso) {
        try {
            if (tipoRecurso == null) {
                return ResponseEntity.badRequest().body("Tipo de recurso inválido");
            }
            if (tipoRecurso.getIdTipo() == null || tipoRecurso.getIdTipo().isEmpty()) {
                tipoRecurso.setIdTipo(generarSiguienteId());
            }
            TipoRecurso nuevoTipo = tipoRecursoRepository.save(tipoRecurso);
            return ResponseEntity.ok(nuevoTipo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear tipo de recurso: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoRecurso> actualizarTipo(@PathVariable String id, @RequestBody TipoRecurso tipoRecurso) {
        if (id == null || id.isEmpty() || tipoRecurso == null) {
            return ResponseEntity.badRequest().build();
        }
        return tipoRecursoRepository.findById(id)
                .map(tipoExistente -> {
                    tipoExistente.setNombre(tipoRecurso.getNombre());
                    tipoExistente.setDescripcion(tipoRecurso.getDescripcion());
                    return ResponseEntity.ok(tipoRecursoRepository.save(tipoExistente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarTipo(@PathVariable String id) {
        if (id == null || id.isEmpty()) {
            return ResponseEntity.badRequest().body("ID inválido");
        }
        return tipoRecursoRepository.findById(id)
                .map(tipo -> {
                    try {
                        tipoRecursoRepository.delete(tipo);
                        return ResponseEntity.ok().build();
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().body("No se puede eliminar: el tipo está en uso por recursos");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Genera IDs con formato TR001, TR002, ... tomando el máximo existente
    private String generarSiguienteId() {
        List<TipoRecurso> todos = tipoRecursoRepository.findAll();
        String max = todos.stream()
                .map(TipoRecurso::getIdTipo)
                .filter(id -> id != null && id.length() >= 3)
                .max(String::compareTo)
                .orElse(null);
        if (max == null) return "TR001";
        try {
            String pref = max.substring(0, 2);
            int num = Integer.parseInt(max.substring(2));
            num++;
            if (!pref.matches("[A-Za-z]{2}")) pref = "TR";
            return String.format("%s%03d", pref, num);
        } catch (Exception e) {
            return "TR001";
        }
    }
}
