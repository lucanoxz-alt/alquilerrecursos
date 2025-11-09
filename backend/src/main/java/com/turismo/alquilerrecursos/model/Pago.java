package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PAGO")
public class Pago {

    @Id
    @Column(name = "id_pago", columnDefinition = "CHAR(6)")
    private String idPago;

    @Column(name = "id_alquiler", columnDefinition = "CHAR(6)")
    private String idAlquiler;

    @Column(name = "subtotal", precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "descuento_aplicado", precision = 10, scale = 2, nullable = false)
    private BigDecimal descuentoAplicado;

    @Column(name = "total_final", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalFinal;

    @Column(name = "monto_pagado", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoPagado;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    @Column(name = "num_boleta", length = 50, unique = true)
    private String numBoleta;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    public Pago() {}

    public String getIdPago() { return idPago; }
    public void setIdPago(String idPago) { this.idPago = idPago; }

    public String getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(String idAlquiler) { this.idAlquiler = idAlquiler; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDescuentoAplicado() { return descuentoAplicado; }
    public void setDescuentoAplicado(BigDecimal descuentoAplicado) { this.descuentoAplicado = descuentoAplicado; }

    public BigDecimal getTotalFinal() { return totalFinal; }
    public void setTotalFinal(BigDecimal totalFinal) { this.totalFinal = totalFinal; }

    public BigDecimal getMontoPagado() { return montoPagado; }
    public void setMontoPagado(BigDecimal montoPagado) { this.montoPagado = montoPagado; }

    public LocalDateTime getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDateTime fechaEmision) { this.fechaEmision = fechaEmision; }

    public String getNumBoleta() { return numBoleta; }
    public void setNumBoleta(String numBoleta) { this.numBoleta = numBoleta; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
}