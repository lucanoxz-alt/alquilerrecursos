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

    @Transactional
    public Reserva crearReserva(ReservaRequest request) { // ← Debe ser public
        // 1. Calcular costo total
        BigDecimal costoTotal = BigDecimal.ZERO;
        for (ReservaRequest.RecursoSolicitado recursoReq : request.getRecursos()) {
            Recurso recurso = recursoRepository.findById(recursoReq.getIdRecurso())
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + recursoReq.getIdRecurso()));
            BigDecimal subtotal = recurso.getTarifaHora()
                .multiply(BigDecimal.valueOf(recursoReq.getHorasSolicitadas()));
            costoTotal = costoTotal.add(subtotal);
        }

        // 2. Aplicar promoción si existe y cumple condición
        Promocion promocion = null;
        if (request.getIdPromocion() != null && !request.getIdPromocion().isEmpty()) {
            promocion = promocionRepository.findById(request.getIdPromocion())
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
        // campos de cancelación en null por defecto

        reserva = reservaRepository.save(reserva);

        // 5. Guardar detalles de reserva
        for (int i = 0; i < request.getRecursos().size(); i++) {
            ReservaRequest.RecursoSolicitado r = request.getRecursos().get(i);
            DetalleReserva detalle = new DetalleReserva();
            detalle.setIdDetalleReserva("DR" + String.format("%03d", i + 1 + detalleReservaRepository.findAll().size()));
            detalle.setIdReserva(idReserva);
            detalle.setIdRecurso(r.getIdRecurso());
            detalle.setHorasSolicitadas(r.getHorasSolicitadas());
            detalleReservaRepository.save(detalle);
        }

        // 6. Registrar pago del 50%
        BigDecimal montoPago = costoTotal.multiply(BigDecimal.valueOf(0.5))
                .setScale(2, RoundingMode.HALF_UP); // ✅ Forma moderna (Java 9+)
        PagoReserva pago = new PagoReserva();
        pago.setIdPagoReserva("PR" + String.format("%03d", pagoReservaRepository.findAll().size() + 1));
        pago.setIdReserva(idReserva);
        pago.setMontoPago(montoPago);
        pago.setFechaPago(LocalDateTime.now());
        pago.setMetodoPago("Tarjeta"); // o recibirlo del frontend
        pago.setNumComprobante("COMP-" + UUID.randomUUID().toString().substring(0, 8));
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

        // 4. Guardar la reserva actualizada
        reserva = reservaRepository.save(reserva);

        // 5. Llamar a la lógica de devolución (puedes implementarla más adelante)
        devolverPagoReserva(idReserva);

        return reserva;
    }

    // Método de devolución (por ahora solo registra en logs o en BD si lo deseas)
    private void devolverPagoReserva(String idReserva) {
        // Aquí puedes:
        // - Registrar una transacción de devolución en una nueva tabla.
        // - Llamar a una pasarela de pago (en producción).
        // Por ahora, dejamos un placeholder.
        System.out.println("Devolución procesada para la reserva: " + idReserva);
    }

}