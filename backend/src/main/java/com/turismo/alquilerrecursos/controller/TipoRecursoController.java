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
    public ResponseEntity<TipoRecurso> crearTipo(@RequestBody TipoRecurso tipoRecurso) {
        if (tipoRecurso == null) {
            return ResponseEntity.badRequest().build();
        }
        TipoRecurso nuevoTipo = tipoRecursoRepository.save(tipoRecurso);
        return ResponseEntity.ok(nuevoTipo);
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
            return ResponseEntity.badRequest().build();
        }
        return tipoRecursoRepository.findById(id)
                .map(tipo -> {
                    tipoRecursoRepository.delete(tipo);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}