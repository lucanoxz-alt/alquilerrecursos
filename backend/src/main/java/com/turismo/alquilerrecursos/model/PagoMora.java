package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PAGO_MORA")
public class PagoMora {
    @Id
    @Column(name = "id_pago_mora", columnDefinition = "CHAR(6)")
    private String idPagoMora;

    @Column(name = "id_alquiler", columnDefinition = "CHAR(6)")
    private String idAlquiler;

    @Column(name = "num_boleta", length = 20)
    private String numBoleta;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @Column(name = "horas_retraso", precision = 10, scale = 2)
    private BigDecimal horasRetraso;

    @Column(name = "monto_mora", precision = 10, scale = 2)
    private BigDecimal montoMora;

    @Column(name = "metodo_pago", length = 20)
    private String metodoPago;

    public String getIdPagoMora() { return idPagoMora; }
    public void setIdPagoMora(String idPagoMora) { this.idPagoMora = idPagoMora; }
    public String getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(String idAlquiler) { this.idAlquiler = idAlquiler; }
    public String getNumBoleta() { return numBoleta; }
    public void setNumBoleta(String numBoleta) { this.numBoleta = numBoleta; }
    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }
    public BigDecimal getHorasRetraso() { return horasRetraso; }
    public void setHorasRetraso(BigDecimal horasRetraso) { this.horasRetraso = horasRetraso; }
    public BigDecimal getMontoMora() { return montoMora; }
    public void setMontoMora(BigDecimal montoMora) { this.montoMora = montoMora; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
}
