package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PAGO_RESERVA")
public class PagoReserva {

    @Id
    @Column(name = "id_pago_reserva", columnDefinition = "CHAR(6)")
    private String idPagoReserva;

    @Column(name = "id_reserva", columnDefinition = "CHAR(6)")
    private String idReserva;

    @Column(name = "monto_pago", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoPago;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "num_comprobante", length = 100)
    private String numComprobante;

    public PagoReserva() {}

    public String getIdPagoReserva() { return idPagoReserva; }
    public void setIdPagoReserva(String idPagoReserva) { this.idPagoReserva = idPagoReserva; }

    public String getIdReserva() { return idReserva; }
    public void setIdReserva(String idReserva) { this.idReserva = idReserva; }

    public BigDecimal getMontoPago() { return montoPago; }
    public void setMontoPago(BigDecimal montoPago) { this.montoPago = montoPago; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getNumComprobante() { return numComprobante; }
    public void setNumComprobante(String numComprobante) { this.numComprobante = numComprobante; }
}