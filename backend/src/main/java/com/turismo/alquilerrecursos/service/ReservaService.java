package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.dto.CancelacionReservaRequest;
import com.turismo.alquilerrecursos.dto.ReservaRequest;
import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;
    @Autowired
    private DetalleReservaRepository detalleReservaRepository;
    @Autowired
    private PagoReservaRepository pagoReservaRepository;
    @Autowired
    private RecursoRepository recursoRepository;
    @Autowired
    private PromocionRepository promocionRepository;
    @Autowired
    private AlquilerRepository alquilerRepository;
    @Autowired
    private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private PagoService pagoService;

    @Transactional
    public Reserva crearReserva(ReservaRequest request) { // ← Debe ser public
        // 1. Validar que los recursos existen y están disponibles
        for (ReservaRequest.RecursoSolicitado recursoReq : request.getRecursos()) {
            String idRecurso = recursoReq.getIdRecurso();
            if (idRecurso == null) {
                throw new RuntimeException("ID de recurso no puede ser null");
            }
            
            // Verificación básica de disponibilidad
            Recurso recurso = recursoRepository.findById(idRecurso)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
            
            if (!"Disponible".equals(recurso.getEstado())) {
                throw new RuntimeException("Recurso " + idRecurso + " no está disponible (Estado: " + recurso.getEstado() + ")");
            }
        }
        
        // 2. Calcular costo total
        BigDecimal costoTotal = BigDecimal.ZERO;
        for (ReservaRequest.RecursoSolicitado recursoReq : request.getRecursos()) {
            String idRecurso = recursoReq.getIdRecurso();
            if (idRecurso == null) {
                throw new RuntimeException("ID de recurso no puede ser null");
            }
            Recurso recurso = recursoRepository.findById(idRecurso)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
            BigDecimal subtotal = recurso.getTarifaHora()
                .multiply(BigDecimal.valueOf(recursoReq.getHorasSolicitadas()));
            costoTotal = costoTotal.add(subtotal);
        }

        // Guardamos el costo original antes de aplicar promoción para registrar descuentos
        BigDecimal costoOriginal = costoTotal;

        // 2. Aplicar promoción si existe y cumple condición
        Promocion promocion = null;
        String idPromocion = request.getIdPromocion();
        if (idPromocion != null && !idPromocion.isEmpty()) {
            promocion = promocionRepository.findById(idPromocion)
                .orElse(null);
            if (promocion != null && promocion.getActiva()) {
                int totalHoras = request.getRecursos().stream()
                    .mapToInt(ReservaRequest.RecursoSolicitado::getHorasSolicitadas)
                    .sum();
                if (totalHoras >= promocion.getCondicionMinima()) {
                    BigDecimal descuento = costoTotal.multiply(promocion.getPorcentajeDesc()).divide(BigDecimal.valueOf(100));
                    costoTotal = costoTotal.subtract(descuento);
                }
            }
        }

        // 3. Generar ID de reserva (RES001, RES002, ...)
        String idReserva = "RES" + String.format("%03d", reservaRepository.findAll().size() + 1);

        // 4. Crear la reserva
        Reserva reserva = new Reserva();
        reserva.setIdReserva(idReserva);
        reserva.setIdTurista(request.getIdTurista());
        reserva.setFechaHoraInicioPrevista(request.getFechaHoraInicioPrevista());
        reserva.setEstadoreserva("Pendiente");
        reserva.setCostoTotalEstimado(costoTotal);
        reserva.setIdPromocion(promocion != null ? promocion.getIdPromocion() : null);
        reserva.setIdUsuarioGestor(request.getIdUsuarioGestor());
        // campos de cancelación en null por defecto

        reserva = reservaRepository.save(reserva);

        // 5. Cambiar estado de recursos a "Reservado"
        for (ReservaRequest.RecursoSolicitado r : request.getRecursos()) {
            String idRecurso = r.getIdRecurso();
            if (idRecurso != null) {
                Recurso recurso = recursoRepository.findById(idRecurso)
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                recurso.setEstado("Reservado");
                recursoRepository.save(recurso);
            }
        }
        
        // 6. Guardar detalles de reserva
        List<ReservaRequest.RecursoSolicitado> recursos = request.getRecursos();
        for (int i = 0; i < recursos.size(); i++) {
            ReservaRequest.RecursoSolicitado r = recursos.get(i);
            DetalleReserva detalle = new DetalleReserva();
            detalle.setIdDetalleReserva("DR" + String.format("%03d", i + 1 + detalleReservaRepository.findAll().size()));
            if (idReserva != null) {
                detalle.setIdReserva(idReserva);
            }
            detalle.setIdRecurso(r.getIdRecurso());
            detalle.setHorasSolicitadas(r.getHorasSolicitadas());
            detalleReservaRepository.save(detalle);
        }

        // 7. Registrar pago del 50%
        BigDecimal montoPago = costoTotal.multiply(BigDecimal.valueOf(0.5))
                .setScale(2, RoundingMode.HALF_UP); // ✅ Forma moderna (Java 9+)
        PagoReserva pago = new PagoReserva();
        pago.setIdPagoReserva("PR" + String.format("%03d", pagoReservaRepository.findAll().size() + 1));
        pago.setIdReserva(idReserva);
        pago.setMontoPago(montoPago);
        pago.setFechaPago(LocalDateTime.now());
        pago.setMetodoPago(request.getMetodoPago() != null && !request.getMetodoPago().isEmpty() ? request.getMetodoPago() : "Tarjeta");
        pago.setNumComprobante("COMP-" + UUID.randomUUID().toString().substring(0, 8));
        // Calcular y registrar el descuento aplicado (si corresponde)
        java.math.BigDecimal descuentoAplicado = costoOriginal.subtract(costoTotal).setScale(2, RoundingMode.HALF_UP);
        pago.setDescuentoAplicado(descuentoAplicado.compareTo(java.math.BigDecimal.ZERO) > 0 ? descuentoAplicado : java.math.BigDecimal.ZERO);
        pagoReservaRepository.save(pago);

        return reserva;
    }

    @Transactional
    public Reserva cancelarReserva(String idReserva, CancelacionReservaRequest request) {
        // 1. Buscar la reserva
        Reserva reserva = reservaRepository.findByIdReserva(idReserva);
        if (reserva == null) {
            throw new RuntimeException("Reserva no encontrada: " + idReserva);
        }

        // 2. Verificar que no esté ya cancelada
        if ("Cancelada".equals(reserva.getEstadoreserva())) {
            throw new RuntimeException("La reserva ya está cancelada.");
        }

        // 3. Actualizar campos de cancelación
        reserva.setEstadoreserva("Cancelada");
        reserva.setFechaCancelacion(LocalDateTime.now());
        reserva.setIdUsuarioCancelacion(request.getIdUsuarioCancelacion());
        reserva.setMotivoCancelacion(request.getMotivoCancelacion());

        // 4. Liberar recursos (cambiar estado a "Disponible")
        if (idReserva != null) {
            List<DetalleReserva> detallesReserva = detalleReservaRepository.findByIdReserva(idReserva);
            for (DetalleReserva detalle : detallesReserva) {
                String idRecurso = detalle.getIdRecurso();
                if (idRecurso != null && !idRecurso.isEmpty()) {
                    Recurso recurso = recursoRepository.findById(idRecurso)
                        .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + idRecurso));
                    recurso.setEstado("Disponible");
                    recursoRepository.save(recurso);
                }
            }
        }

        // 5. Guardar la reserva actualizada
        reserva = reservaRepository.save(reserva);

        // 6. Llamar a la lógica de devolución
        devolverPagoReserva(idReserva);

        return reserva;
    }

    // Método de devolución (por ahora solo registra en logs o en BD si lo deseas)
    private void devolverPagoReserva(String idReserva) {
        try {
            Reserva r = reservaRepository.findByIdReserva(idReserva);
            if (r == null) return;
            java.math.BigDecimal devolucion = r.getCostoTotalEstimado().multiply(java.math.BigDecimal.valueOf(0.5));
            pagoService.crearDevolucion(idReserva, devolucion, "Cancelación de reserva");
        } catch (Exception e) {
            System.err.println("Error registrando devolución: "+e.getMessage());
        }
    }

    /**
     * Obtener todas las reservas
     */
    public List<Reserva> obtenerTodasLasReservas() {
        return reservaRepository.findAll();
    }

    /**
     * Obtener una reserva por ID
     */
    public Reserva obtenerReservaPorId(String idReserva) {
        return reservaRepository.findById(idReserva).orElse(null);
    }

    /**
     * Obtener reservas por estado
     */
    public List<Reserva> obtenerReservasPorEstado(String estado) {
        return reservaRepository.findByEstadoreserva(estado);
    }

    /**
     * Obtener reservas por turista
     */
    public List<Reserva> obtenerReservasPorTurista(String idTurista) {
        return reservaRepository.findByIdTurista(idTurista);
    }

    /**
     * Confirmar una reserva (cambiar estado de Pendiente a Confirmada)
     */
    @Transactional
    public com.turismo.alquilerrecursos.dto.ConfirmacionReservaResponse confirmarReserva(String idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva)
            .orElseThrow(() -> new RuntimeException("Reserva no encontrada: " + idReserva));

        if (!"Pendiente".equals(reserva.getEstadoreserva())) {
            throw new RuntimeException("Solo se pueden confirmar reservas en estado Pendiente");
        }

        // 1) Construir Alquiler desde la reserva
        String nuevoIdAlquiler = "ALQ" + String.format("%03d", alquilerRepository.findAll().size() + 1);
        Alquiler alquiler = new Alquiler();
        alquiler.setIdAlquiler(nuevoIdAlquiler);
        alquiler.setIdReserva(reserva.getIdReserva());
        alquiler.setIdTurista(reserva.getIdTurista());
        alquiler.setIdUsuarioGestor(reserva.getIdUsuarioGestor());
        alquiler.setFechaHoraInicio(reserva.getFechaHoraInicioPrevista());
        
        List<DetalleReserva> detallesReserva = detalleReservaRepository.findByIdReserva(idReserva);
        int duracionTotal = detallesReserva.stream().mapToInt(DetalleReserva::getHorasSolicitadas).sum();
        alquiler.setDuracionHoras(duracionTotal);
        alquiler.setEstadoalquiler("Activo");
        alquiler.setIdPromocion(reserva.getIdPromocion());

        // Calcular costo total real (antes de aplicar promoción)
        java.math.BigDecimal costoOriginal = java.math.BigDecimal.ZERO;
        for (DetalleReserva dr : detallesReserva) {
            Recurso rec = recursoRepository.findById(dr.getIdRecurso()).orElseThrow(() -> new RuntimeException("Recurso no encontrado: "+dr.getIdRecurso()));
            java.math.BigDecimal parcial = rec.getTarifaHora().multiply(java.math.BigDecimal.valueOf(dr.getHorasSolicitadas()));
            costoOriginal = costoOriginal.add(parcial);
        }

        // Aplicar promoción si corresponde
        java.math.BigDecimal costoFinal = costoOriginal;
        java.math.BigDecimal descuentoAplicado = java.math.BigDecimal.ZERO;
        if (reserva.getIdPromocion() != null) {
            Promocion promo = promocionRepository.findById(reserva.getIdPromocion()).orElse(null);
            if (promo != null && promo.getActiva()) {
                int totalHoras = detallesReserva.stream().mapToInt(DetalleReserva::getHorasSolicitadas).sum();
                if (totalHoras >= promo.getCondicionMinima()) {
                    descuentoAplicado = costoOriginal.multiply(promo.getPorcentajeDesc()).divide(java.math.BigDecimal.valueOf(100)).setScale(2, java.math.RoundingMode.HALF_UP);
                    costoFinal = costoOriginal.subtract(descuentoAplicado);
                }
            }
        }

        alquiler.setCostoTotal(costoFinal);
        alquilerRepository.save(alquiler);

        // 2) Crear detalles de alquiler
        int offset = detalleAlquilerRepository.findAll().size();
        for (int i = 0; i < detallesReserva.size(); i++) {
            DetalleReserva dr = detallesReserva.get(i);
            Recurso rec = recursoRepository.findById(dr.getIdRecurso()).orElseThrow();
            DetalleAlquiler da = new DetalleAlquiler();
            da.setIdDetalle("DA" + String.format("%03d", offset + i + 1));
            da.setIdAlquiler(nuevoIdAlquiler);
            da.setIdRecurso(dr.getIdRecurso());
            da.setHorasRealizadas(dr.getHorasSolicitadas());
            da.setCostoParcial(rec.getTarifaHora().multiply(java.math.BigDecimal.valueOf(dr.getHorasSolicitadas())));
            detalleAlquilerRepository.save(da);
        }

        // 3) Registrar pago del 100% para el alquiler (con descuento si aplica)
        String idPago = "PAG" + String.format("%03d", pagoRepository.findAll().size() + 1);
        Pago pago = new Pago();
        pago.setIdPago(idPago);
        pago.setIdAlquiler(nuevoIdAlquiler);
        pago.setSubtotal(costoOriginal);
        pago.setDescuentoAplicado(descuentoAplicado);
        pago.setTotalFinal(costoFinal);
        pago.setMontoPagado(costoFinal);
        pago.setFechaEmision(java.time.LocalDateTime.now());
        pago.setNumBoleta("B002-" + String.format("%08d", pagoRepository.findAll().size() + 1));
        pago.setMetodoPago("Saldo");
        pagoRepository.save(pago);

        // 4) Cambiar recursos a "Alquilado"
        for (DetalleReserva dr : detallesReserva) {
            Recurso rec = recursoRepository.findById(dr.getIdRecurso()).orElseThrow();
            rec.setEstado("Alquilado");
            recursoRepository.save(rec);
        }

        // 5) Cambiar estado de la reserva a Confirmada
        reserva.setEstadoreserva("Confirmada");
        reservaRepository.save(reserva);

        return new com.turismo.alquilerrecursos.dto.ConfirmacionReservaResponse(reserva, alquiler, pago);
    }

}