package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.dto.AlquilerRequest;
import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;


@Service
public class AlquilerService {

    @Autowired
    private AlquilerRepository alquilerRepository;
    @Autowired
    private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private ReservaRepository reservaRepository;
    @Autowired
    private RecursoRepository recursoRepository;
    @Autowired
    private PromocionRepository promocionRepository;
    @Autowired
    private DisponibilidadService disponibilidadService;
    @Autowired
    private com.turismo.alquilerrecursos.repository.UsuarioRepository usuarioRepository;

    @Transactional
    public Alquiler crearAlquiler(AlquilerRequest request) {
        String idReserva = request.getIdReserva();
        boolean desdeReserva = idReserva != null && !idReserva.isEmpty();
        BigDecimal costoTotal = BigDecimal.ZERO;

        // 1. Si es desde reserva, validar y reutilizar datos
        if (desdeReserva) {
            if (idReserva == null) {
                throw new RuntimeException("ID de reserva no puede ser null");
            }
            Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada: " + idReserva));
            String estadoReserva = reserva.getEstadoreserva();
            if (estadoReserva == null || !"Pendiente".equals(estadoReserva)) {
                throw new RuntimeException("La reserva no está en estado Pendiente.");
            }
            request.setIdTurista(reserva.getIdTurista());
            request.setIdPromocion(reserva.getIdPromocion());

            // 2. Calcular costo total (incluye reserva)
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                BigDecimal subtotal = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                costoTotal = costoTotal.add(subtotal);
            }

            // 3. Aplicar promoción si corresponde
            Promocion promocion = null;
            String idPromocion = request.getIdPromocion();
            if (idPromocion != null && !idPromocion.isEmpty()) {
                promocion = promocionRepository.findById(idPromocion).orElse(null);
                if (promocion != null && promocion.getActiva()) {
                    int totalHoras = request.getRecursos().stream()
                        .mapToInt(AlquilerRequest.RecursoSolicitado::getHorasSolicitadas)
                        .sum();
                    if (totalHoras >= promocion.getCondicionMinima()) {
                        BigDecimal descuento = costoTotal.multiply(promocion.getPorcentajeDesc()).divide(BigDecimal.valueOf(100));
                        costoTotal = costoTotal.subtract(descuento);
                    }
                }
            }

            // 4. Generar ID
            String idAlquiler = "ALQ" + String.format("%03d", alquilerRepository.findAll().size() + 1);

            // 5. Crear alquiler
            Alquiler alquiler = new Alquiler();
            alquiler.setIdAlquiler(idAlquiler);
            alquiler.setIdTurista(request.getIdTurista());
            alquiler.setIdUsuarioGestor("USR001"); // TEMPORAL
            alquiler.setFechaHoraInicio(request.getFechaHoraInicio());
            alquiler.setDuracionHoras(request.getRecursos().stream()
                .mapToInt(AlquilerRequest.RecursoSolicitado::getHorasSolicitadas)
                .sum());
            alquiler.setCostoTotal(costoTotal);
            alquiler.setEstadoalquiler("Activo");
            alquiler.setFechaHoraFin(request.getFechaHoraInicio().plusHours(alquiler.getDuracionHoras()));
            alquiler.setIdReserva(idReserva);
            alquiler.setIdPromocion(promocion != null ? promocion.getIdPromocion() : null);
            alquilerRepository.save(alquiler);

           // Asignar gestor autenticado y persistir
           try {
               org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
               String gestor = null;
               if (auth != null && auth.getName() != null) {
                   com.turismo.alquilerrecursos.model.Usuario u = usuarioRepository.findByUsername(auth.getName());
                   if (u != null) gestor = u.getIdUsuario();
               }
               alquiler.setIdUsuarioGestor(gestor != null ? gestor : "USR001");
               alquilerRepository.save(alquiler);
           } catch (Exception ignored) {}

           // 6. Cambiar estado de recursos a "Alquilado"
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                recurso.setEstado("Alquilado");
                recursoRepository.save(recurso);
            }
            
            // 7. Detalles
            for (int i = 0; i < request.getRecursos().size(); i++) {
                AlquilerRequest.RecursoSolicitado r = request.getRecursos().get(i);
                DetalleAlquiler detalle = new DetalleAlquiler();
                detalle.setIdDetalle("DA" + String.format("%03d", i + 1 + detalleAlquilerRepository.findAll().size()));
                detalle.setIdAlquiler(idAlquiler);
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                detalle.setIdRecurso(idRecurso);
                detalle.setHorasRealizadas(r.getHorasSolicitadas());

                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                BigDecimal costoParcial = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                detalle.setCostoParcial(costoParcial);
                detalleAlquilerRepository.save(detalle);
            }

            // 8. Pago (50% restante)
            BigDecimal montoPagado = costoTotal.multiply(BigDecimal.valueOf(0.5)).setScale(2, RoundingMode.HALF_UP);
            Pago pago = new Pago();
            pago.setIdPago("PAG" + String.format("%03d", pagoRepository.findAll().size() + 1));
            pago.setIdAlquiler(idAlquiler);
            pago.setSubtotal(costoTotal);
            pago.setDescuentoAplicado(BigDecimal.ZERO);
            pago.setTotalFinal(costoTotal);
            pago.setMontoPagado(montoPagado);
            pago.setFechaEmision(LocalDateTime.now());
            pago.setNumBoleta("BOLETA-" + UUID.randomUUID().toString().substring(0, 8));
            pago.setMetodoPago(request.getMetodoPago());
            pagoRepository.save(pago);

            // 9. Actualizar estado de la reserva
            reserva.setEstadoreserva("Confirmada");
            reservaRepository.save(reserva);

            return alquiler;
        } else {
            // Caso: alquiler directo (sin reserva)
            // Establecer fecha/hora de inicio por defecto (hora de Lima) si no viene
            if (request.getFechaHoraInicio() == null) {
                request.setFechaHoraInicio(LocalDateTime.now(ZoneId.of("America/Lima")));
            }
            // VALIDAR DISPONIBILIDAD PRIMERO
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                
                boolean disponible = disponibilidadService.verificarDisponibilidadRecurso(
                    idRecurso, 
                    request.getFechaHoraInicio(), 
                    r.getHorasSolicitadas()
                );
                
                if (!disponible) {
                    String detalle = disponibilidadService.obtenerDetalleConflicto(
                        idRecurso, 
                        request.getFechaHoraInicio(), 
                        r.getHorasSolicitadas()
                    );
                    throw new RuntimeException("Recurso " + idRecurso + " no disponible: " + detalle);
                }
            }
            
            // Calcular costo total
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                BigDecimal subtotal = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                costoTotal = costoTotal.add(subtotal);
            }

            Promocion promocion = null;
            String idPromocion = request.getIdPromocion();
            if (idPromocion != null && !idPromocion.isEmpty()) {
                promocion = promocionRepository.findById(idPromocion).orElse(null);
                if (promocion != null && promocion.getActiva()) {
                    int totalHoras = request.getRecursos().stream()
                        .mapToInt(AlquilerRequest.RecursoSolicitado::getHorasSolicitadas)
                        .sum();
                    if (totalHoras >= promocion.getCondicionMinima()) {
                        BigDecimal descuento = costoTotal.multiply(promocion.getPorcentajeDesc()).divide(BigDecimal.valueOf(100));
                        costoTotal = costoTotal.subtract(descuento);
                    }
                }
            }

            String idAlquiler = "ALQ" + String.format("%03d", alquilerRepository.findAll().size() + 1);
            Alquiler alquiler = new Alquiler();
            alquiler.setIdAlquiler(idAlquiler);
            alquiler.setIdTurista(request.getIdTurista());
            alquiler.setIdUsuarioGestor("USR001"); // TEMPORAL
            alquiler.setFechaHoraInicio(request.getFechaHoraInicio());
            alquiler.setDuracionHoras(request.getRecursos().stream()
                .mapToInt(AlquilerRequest.RecursoSolicitado::getHorasSolicitadas)
                .sum());
            alquiler.setCostoTotal(costoTotal);
            alquiler.setEstadoalquiler("Activo");
            alquiler.setIdReserva(null);
            alquiler.setIdPromocion(promocion != null ? promocion.getIdPromocion() : null);
            alquiler.setFechaHoraFin(request.getFechaHoraInicio().plusHours(alquiler.getDuracionHoras()));
            alquilerRepository.save(alquiler);

           // Asignar gestor autenticado y persistir
           try {
               org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
               String gestor = null;
               if (auth != null && auth.getName() != null) {
                   com.turismo.alquilerrecursos.model.Usuario u = usuarioRepository.findByUsername(auth.getName());
                   if (u != null) gestor = u.getIdUsuario();
               }
               alquiler.setIdUsuarioGestor(gestor != null ? gestor : "USR001");
               alquilerRepository.save(alquiler);
           } catch (Exception ignored) {}

           // Cambiar estado de recursos a "Alquilado"
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                recurso.setEstado("Alquilado");
                recursoRepository.save(recurso);
            }

            for (int i = 0; i < request.getRecursos().size(); i++) {
                AlquilerRequest.RecursoSolicitado r = request.getRecursos().get(i);
                DetalleAlquiler detalle = new DetalleAlquiler();
                detalle.setIdDetalle("DA" + String.format("%03d", i + 1 + detalleAlquilerRepository.findAll().size()));
                detalle.setIdAlquiler(idAlquiler);
                String idRecurso = r.getIdRecurso();
                if (idRecurso == null) {
                    throw new RuntimeException("ID de recurso no puede ser null");
                }
                detalle.setIdRecurso(idRecurso);
                detalle.setHorasRealizadas(r.getHorasSolicitadas());

                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                BigDecimal costoParcial = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                detalle.setCostoParcial(costoParcial);
                detalleAlquilerRepository.save(detalle);
            }

            // Pago del 100%
            Pago pago = new Pago();
            pago.setIdPago("PAG" + String.format("%03d", pagoRepository.findAll().size() + 1));
            pago.setIdAlquiler(idAlquiler);
            pago.setSubtotal(costoTotal);
            pago.setDescuentoAplicado(BigDecimal.ZERO);
            pago.setTotalFinal(costoTotal);
            pago.setMontoPagado(costoTotal); // ← 100%
            pago.setFechaEmision(LocalDateTime.now());
            pago.setNumBoleta("BOLETA-" + UUID.randomUUID().toString().substring(0, 8));
            pago.setMetodoPago(request.getMetodoPago());
            pagoRepository.save(pago);

            return alquiler;
        }
    }

    /**
     * Finaliza un alquiler y libera los recursos
     */
    @Transactional
    public Alquiler finalizarAlquiler(String idAlquiler) {
        // 1. Buscar el alquiler
        Alquiler alquiler = alquilerRepository.findById(idAlquiler)
            .orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        
        // 2. Verificar que esté activo
        if (!"Activo".equals(alquiler.getEstadoalquiler())) {
            throw new RuntimeException("El alquiler no está activo");
        }
        
        // 3. Cambiar estado del alquiler
        alquiler.setEstadoalquiler("Finalizado");
        alquiler.setFechaHoraFin(LocalDateTime.now());
        alquilerRepository.save(alquiler);
        
        // 4. Liberar recursos (cambiar estado a "Disponible")
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(idAlquiler);
        for (DetalleAlquiler detalle : detalles) {
            Recurso recurso = recursoRepository.findById(detalle.getIdRecurso())
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + detalle.getIdRecurso()));
            recurso.setEstado("Disponible");
            recursoRepository.save(recurso);
        }
        
        return alquiler;
    }
}