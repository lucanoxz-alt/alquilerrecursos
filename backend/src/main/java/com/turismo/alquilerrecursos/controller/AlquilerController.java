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
        java.time.format.DateTimeFormatter formato = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy, HH:mm").withZone(java.time.ZoneId.of("America/Lima"));
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

            AlquilerListadoDTO dto = new AlquilerListadoDTO(
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
            try {
                if (a.getFechaHoraInicio() != null) dto.setFechaHoraInicioFmt(a.getFechaHoraInicio().format(formato));
            } catch (Exception ignored) {}
            return dto;
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

    // ---------------- Comprobantes: ticket, factura y xml ----------------
    @Autowired
    private com.turismo.alquilerrecursos.service.ComprobantePagoService comprobantePagoService;

    @GetMapping("/{idAlquiler}/ticket")
    public ResponseEntity<byte[]> verTicket(@PathVariable String idAlquiler) {
        Alquiler a = alquilerRepository.findById(idAlquiler).orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        if (!"Activo".equalsIgnoreCase(a.getEstadoalquiler()) && !"Finalizado".equalsIgnoreCase(a.getEstadoalquiler())) {
            return ResponseEntity.badRequest().body(null);
        }
        var data = comprobantePagoService.generarDatosComprobantePagoPorAlquiler(idAlquiler);
        data.put("tipo", "TICKET");
        byte[] pdf = comprobantePagoService.generarPDFDesdeDatos(data);
        String num = String.valueOf(((java.util.Map)data.get("pago")).get("num"));
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"TICKET-" + (num != null ? num : idAlquiler) + ".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/{idAlquiler}/factura")
    public ResponseEntity<byte[]> verFactura(@PathVariable String idAlquiler) {
        Alquiler a = alquilerRepository.findById(idAlquiler).orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        if (!"Activo".equalsIgnoreCase(a.getEstadoalquiler()) && !"Finalizado".equalsIgnoreCase(a.getEstadoalquiler())) {
            return ResponseEntity.badRequest().body(null);
        }
        var data = comprobantePagoService.generarDatosComprobantePagoPorAlquiler(idAlquiler);
        data.put("tipo", "FACTURA");
        byte[] pdf = comprobantePagoService.generarPDFDesdeDatos(data);
        String num = String.valueOf(((java.util.Map)data.get("pago")).get("num"));
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"FACTURA-" + (num != null ? num : idAlquiler) + ".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/{idAlquiler}/xml")
    public ResponseEntity<String> descargarXML(@PathVariable String idAlquiler) {
        Alquiler a = alquilerRepository.findById(idAlquiler).orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        if (!"Activo".equalsIgnoreCase(a.getEstadoalquiler()) && !"Finalizado".equalsIgnoreCase(a.getEstadoalquiler())) {
            return ResponseEntity.badRequest().body("Alquiler no autorizado para generar comprobante");
        }
        var data = comprobantePagoService.generarDatosComprobantePagoPorAlquiler(idAlquiler);
        String xml = comprobantePagoService.generarXMLDesdeDatos(data);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_XML);
        headers.set("Content-Disposition", "attachment; filename=\"COMPROBANTE-" + idAlquiler + ".xml\"");
        return ResponseEntity.ok().headers(headers).body(xml);
    }

    /**
     * Corregir la fecha de inicio de un alquiler (admin)
     */
    @Autowired
    private com.turismo.alquilerrecursos.repository.PagoRepository pagoRepository;

    @PutMapping("/{idAlquiler}/corregir-fecha")
    public ResponseEntity<?> corregirFecha(@PathVariable String idAlquiler, @RequestBody java.util.Map<String, String> body) {
        String fechaStr = body.get("fechaHoraInicio");
        if (fechaStr == null || fechaStr.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Campo 'fechaHoraInicio' requerido"));
        }
        Alquiler a = alquilerRepository.findById(idAlquiler).orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        try {
            java.time.LocalDateTime nueva = parseToLocalDateTime(fechaStr);
            a.setFechaHoraInicio(nueva);
            if (a.getDuracionHoras() != null) a.setFechaHoraFin(nueva.plusHours(a.getDuracionHoras()));
            alquilerRepository.save(a);
            return ResponseEntity.ok(a);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Formato de fecha inválido: " + e.getMessage()));
        }
    }

    @PostMapping("/{idAlquiler}/sync-fecha-desde-pago")
    public ResponseEntity<?> sincronizarFechaDesdePago(@PathVariable String idAlquiler) {
        Alquiler a = alquilerRepository.findById(idAlquiler).orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        com.turismo.alquilerrecursos.model.Pago pago = pagoRepository.findByIdAlquiler(idAlquiler);
        if (pago == null) return ResponseEntity.badRequest().body(java.util.Map.of("error", "No se encontró pago para este alquiler"));
        a.setFechaHoraInicio(pago.getFechaEmision());
        if (a.getDuracionHoras() != null) a.setFechaHoraFin(a.getFechaHoraInicio().plusHours(a.getDuracionHoras()));
        alquilerRepository.save(a);
        return ResponseEntity.ok(a);
    }

    private java.time.LocalDateTime parseToLocalDateTime(String s) {
        // Intenta varios formatos y manejo de offsets
        try {
            return java.time.LocalDateTime.parse(s);
        } catch (java.time.format.DateTimeParseException ignored) {}
        try {
            java.time.OffsetDateTime odt = java.time.OffsetDateTime.parse(s);
            return odt.atZoneSameInstant(java.time.ZoneId.systemDefault()).toLocalDateTime();
        } catch (java.time.format.DateTimeParseException ignored) {}
        try {
            java.time.format.DateTimeFormatter f = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            return java.time.LocalDateTime.parse(s, f);
        } catch (java.time.format.DateTimeParseException e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}