package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.dto.AlquilerRequest;
import com.turismo.alquilerrecursos.model.Alquiler;
import com.turismo.alquilerrecursos.model.Turista;
import com.turismo.alquilerrecursos.repository.TuristaRepository;
import com.turismo.alquilerrecursos.dto.AlquilerListadoDTO;
import com.turismo.alquilerrecursos.service.AlquilerService;
import com.turismo.alquilerrecursos.repository.AlquilerRepository;
import com.turismo.alquilerrecursos.repository.DetalleAlquilerRepository;
import com.turismo.alquilerrecursos.repository.RecursoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/alquileres")
public class AlquilerController {

    @Autowired
    private AlquilerService alquilerService;
    
    @Autowired
    private AlquilerRepository alquilerRepository;
    
    @Autowired
    private TuristaRepository turistaRepository;

    @Autowired
    private DetalleAlquilerRepository detalleAlquilerRepository;

    @Autowired
    private RecursoRepository recursoRepository;

    /**
     * Crear un nuevo alquiler
     */
    @PostMapping
    public ResponseEntity<?> crearAlquiler(@RequestBody AlquilerRequest request) {
        try {
            Alquiler nuevoAlquiler = alquilerService.crearAlquiler(request);
            return ResponseEntity.ok(nuevoAlquiler);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al crear alquiler: " + e.getMessage());
        }
    }

    /**
     * Finalizar un alquiler
     */
    @PutMapping("/{idAlquiler}/finalizar")
    public ResponseEntity<?> finalizarAlquiler(@PathVariable String idAlquiler) {
        try {
            Alquiler alquilerFinalizado = alquilerService.finalizarAlquiler(idAlquiler);
            return ResponseEntity.ok(alquilerFinalizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al finalizar alquiler: " + e.getMessage());
        }
    }

    /**
     * Obtener todos los alquileres
     */
    @GetMapping
    public ResponseEntity<List<Alquiler>> obtenerTodosLosAlquileres() {
        List<Alquiler> alquileres = alquilerRepository.findAll();
        return ResponseEntity.ok(alquileres);
    }

    /**
     * Obtener todos los alquileres con nombre del cliente (DTO enriquecido)
     */
    @GetMapping("/enriquecidos")
    public ResponseEntity<List<AlquilerListadoDTO>> obtenerAlquileresEnriquecidos() {
        List<Alquiler> alquileres = alquilerRepository.findAll();
        List<AlquilerListadoDTO> dtos = alquileres.stream().map(a -> {
            String nombreCliente = null;
            try {
                Turista t = turistaRepository.findById(a.getIdTurista()).orElse(null);
                if (t != null) {
                    nombreCliente = (t.getNombres() != null ? t.getNombres() : "") +
                                    " " +
                                    (t.getApellidos() != null ? t.getApellidos() : "");
                    nombreCliente = nombreCliente.trim();
                }
            } catch (Exception ignored) {}

            java.util.List<String> nombresRecursos = new java.util.ArrayList<>();
            try {
                var detalles = detalleAlquilerRepository.findByIdAlquiler(a.getIdAlquiler());
                for (var d : detalles) {
                    try {
                        var rec = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                        nombresRecursos.add(rec != null && rec.getNombre() != null ? rec.getNombre() : d.getIdRecurso());
                    } catch (Exception e) {
                        nombresRecursos.add(d.getIdRecurso());
                    }
                }
            } catch (Exception ignored) {}

            return new AlquilerListadoDTO(
                a.getIdAlquiler(),
                a.getIdTurista(),
                (nombreCliente != null && !nombreCliente.isEmpty()) ? nombreCliente : null,
                a.getFechaHoraInicio(),
                a.getDuracionHoras(),
                a.getCostoTotal(),
                a.getEstadoalquiler(),
                nombresRecursos,
                nombresRecursos.size()
            );
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Obtener alquiler por ID
     */
    @GetMapping("/{idAlquiler}")
    public ResponseEntity<Alquiler> obtenerAlquilerPorId(@PathVariable String idAlquiler) {
        Optional<Alquiler> alquiler = alquilerRepository.findById(idAlquiler);
        return alquiler.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Obtener alquileres por turista
     */
    @GetMapping("/turista/{idTurista}")
    public ResponseEntity<List<Alquiler>> obtenerAlquileresPorTurista(@PathVariable String idTurista) {
        List<Alquiler> alquileres = alquilerRepository.findByIdTurista(idTurista);
        return ResponseEntity.ok(alquileres);
    }

    /**
     * Obtener alquileres por estado
     */
    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Alquiler>> obtenerAlquileresPorEstado(@PathVariable String estado) {
        List<Alquiler> alquileres = alquilerRepository.findByEstadoalquiler(estado);
        return ResponseEntity.ok(alquileres);
    }

    /**
     * Obtener alquileres activos
     */
    @GetMapping("/activos")
    public ResponseEntity<List<Alquiler>> obtenerAlquileresActivos() {
        List<Alquiler> alquileres = alquilerRepository.findByEstadoalquiler("Activo");
        return ResponseEntity.ok(alquileres);
    }
}