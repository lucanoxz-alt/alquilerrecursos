package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.dto.AlquilerRequest;
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

    @Transactional
    public Alquiler crearAlquiler(AlquilerRequest request) {
        boolean desdeReserva = request.getIdReserva() != null && !request.getIdReserva().isEmpty();
        BigDecimal costoTotal = BigDecimal.ZERO;

        // 1. Si es desde reserva, validar y reutilizar datos
        if (desdeReserva) {
            Reserva reserva = reservaRepository.findById(request.getIdReserva())
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada: " + request.getIdReserva()));
            if (!"Pendiente".equals(reserva.getEstadoreserva())) {
                throw new RuntimeException("La reserva no está en estado Pendiente.");
            }
            request.setIdTurista(reserva.getIdTurista());
            request.setIdPromocion(reserva.getIdPromocion());

            // 2. Calcular costo total (incluye reserva)
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                Recurso recurso = recursoRepository.findById(r.getIdRecurso())
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + r.getIdRecurso()));
                BigDecimal subtotal = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                costoTotal = costoTotal.add(subtotal);
            }

            // 3. Aplicar promoción si corresponde
            Promocion promocion = null;
            if (request.getIdPromocion() != null && !request.getIdPromocion().isEmpty()) {
                promocion = promocionRepository.findById(request.getIdPromocion()).orElse(null);
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
            alquiler.setIdReserva(request.getIdReserva());
            alquiler.setIdPromocion(promocion != null ? promocion.getIdPromocion() : null);
            alquilerRepository.save(alquiler);

            // 6. Detalles
            for (int i = 0; i < request.getRecursos().size(); i++) {
                AlquilerRequest.RecursoSolicitado r = request.getRecursos().get(i);
                DetalleAlquiler detalle = new DetalleAlquiler();
                detalle.setIdDetalle("DA" + String.format("%03d", i + 1 + detalleAlquilerRepository.findAll().size()));
                detalle.setIdAlquiler(idAlquiler);
                detalle.setIdRecurso(r.getIdRecurso());
                detalle.setHorasRealizadas(r.getHorasSolicitadas());

                Recurso recurso = recursoRepository.findById(r.getIdRecurso()).orElseThrow();
                BigDecimal costoParcial = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                detalle.setCostoParcial(costoParcial);
                detalleAlquilerRepository.save(detalle);
            }

            // 7. Pago (50% restante)
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

            // ✅ Actualizar estado de la reserva
            reserva.setEstadoreserva("Confirmada");
            reservaRepository.save(reserva);

            return alquiler;
        } else {
            // Caso: alquiler directo (sin reserva)
            for (AlquilerRequest.RecursoSolicitado r : request.getRecursos()) {
                Recurso recurso = recursoRepository.findById(r.getIdRecurso())
                    .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + r.getIdRecurso()));
                BigDecimal subtotal = recurso.getTarifaHora().multiply(BigDecimal.valueOf(r.getHorasSolicitadas()));
                costoTotal = costoTotal.add(subtotal);
            }

            Promocion promocion = null;
            if (request.getIdPromocion() != null && !request.getIdPromocion().isEmpty()) {
                promocion = promocionRepository.findById(request.getIdPromocion()).orElse(null);
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
            alquilerRepository.save(alquiler);

            for (int i = 0; i < request.getRecursos().size(); i++) {
                AlquilerRequest.RecursoSolicitado r = request.getRecursos().get(i);
                DetalleAlquiler detalle = new DetalleAlquiler();
                detalle.setIdDetalle("DA" + String.format("%03d", i + 1 + detalleAlquilerRepository.findAll().size()));
                detalle.setIdAlquiler(idAlquiler);
                detalle.setIdRecurso(r.getIdRecurso());
                detalle.setHorasRealizadas(r.getHorasSolicitadas());

                Recurso recurso = recursoRepository.findById(r.getIdRecurso()).orElseThrow();
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
}