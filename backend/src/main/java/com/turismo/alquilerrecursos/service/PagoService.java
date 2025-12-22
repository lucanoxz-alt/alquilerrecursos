package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Pago;
import com.turismo.alquilerrecursos.model.PagoReserva;
import com.turismo.alquilerrecursos.repository.PagoRepository;
import com.turismo.alquilerrecursos.repository.PagoReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PagoService {

    @Autowired
    private PagoRepository pagoRepository;
    
    @Autowired
    private PagoReservaRepository pagoReservaRepository;

    /**
     * Obtener todos los pagos de alquileres
     */
    public List<Pago> obtenerTodosLosPagos() {
        return pagoRepository.findAll();
    }

    /**
     * Obtener pago por ID de alquiler
     */
    public Pago obtenerPagoPorIdAlquiler(String idAlquiler) {
        return pagoRepository.findByIdAlquiler(idAlquiler);
    }

    /**
     * Obtener todos los pagos de reservas
     */
    public List<PagoReserva> obtenerTodosLosPagosReserva() {
        return pagoReservaRepository.findAll();
    }

    /**
     * Obtener pagos de reserva por ID de reserva
     */
    public List<PagoReserva> obtenerPagosReservaPorIdReserva(String idReserva) {
        return pagoReservaRepository.findByIdReserva(idReserva);
    }

    /**
     * Crear pago adicional para un alquiler (ej: pago restante)
     */
    @Transactional
    public Pago crearPagoAdicional(String idAlquiler, BigDecimal monto, String metodoPago, String concepto) {
        // Generar ID único
        String idPago = "PAG" + String.format("%03d", pagoRepository.findAll().size() + 1);
        
        Pago pago = new Pago();
        pago.setIdPago(idPago);
        pago.setIdAlquiler(idAlquiler);
        pago.setSubtotal(monto);
        pago.setDescuentoAplicado(BigDecimal.ZERO);
        pago.setTotalFinal(monto);
        pago.setMontoPagado(monto);
        pago.setFechaEmision(LocalDateTime.now());
        pago.setNumBoleta("BOLETA-" + UUID.randomUUID().toString().substring(0, 8));
        pago.setMetodoPago(metodoPago);
        
        return pagoRepository.save(pago);
    }

    /**
     * Crear devolución por cancelación de reserva
     */
    @Transactional
    public PagoReserva crearDevolucion(String idReserva, BigDecimal montoDevolucion, String motivoDevolucion) {
        // Generar ID único para la devolución
        String idPagoDevolucion = "DEV" + String.format("%03d", pagoReservaRepository.findAll().size() + 1);
        
        PagoReserva devolucion = new PagoReserva();
        devolucion.setIdPagoReserva(idPagoDevolucion);
        devolucion.setIdReserva(idReserva);
        devolucion.setMontoPago(montoDevolucion.negate()); // Monto negativo para indicar devolución
        devolucion.setFechaPago(LocalDateTime.now());
        devolucion.setMetodoPago("Devolucion");
        devolucion.setNumComprobante("DEV-" + UUID.randomUUID().toString().substring(0, 8));
        
        return pagoReservaRepository.save(devolucion);
    }

    /**
     * Obtener historial de pagos por turista
     */
    public List<Pago> obtenerHistorialPagosPorTurista(String idTurista) {
        return pagoRepository.findPagosByTurista(idTurista);
    }

    /**
     * Calcular total pagado por un turista
     */
    public BigDecimal calcularTotalPagadoPorTurista(String idTurista) {
        List<Pago> pagos = pagoRepository.findPagosByTurista(idTurista);
        return pagos.stream()
                   .map(Pago::getMontoPagado)
                   .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Obtener resumen de pagos del día
     */
    public BigDecimal obtenerTotalPagosDelDia() {
        LocalDateTime inicioDelDia = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finDelDia = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        
        List<Pago> pagosDelDia = pagoRepository.findPagosBetweenDates(inicioDelDia, finDelDia);
        return pagosDelDia.stream()
                         .map(Pago::getMontoPagado)
                         .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}