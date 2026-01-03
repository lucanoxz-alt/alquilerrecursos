package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "DETALLE_ALQUILER")
public class DetalleAlquiler {

    @Id
    @Column(name = "id_detalle", columnDefinition = "CHAR(6)")
    private String idDetalle;

    @Column(name = "id_alquiler", columnDefinition = "CHAR(6)")
    private String idAlquiler;

    @Column(name = "id_recurso", columnDefinition = "CHAR(6)")
    private String idRecurso;

    @Column(name = "horas_realizadas", nullable = false)
    @Convert(converter = com.turismo.alquilerrecursos.util.IntDecimalConverter.class)
    private Integer horasRealizadas;

    @Column(name = "costo_parcial", precision = 10, scale = 2, nullable = false)
    private BigDecimal costoParcial;

    // Nuevos campos para control de devolución y mora
    @Column(name = "fecha_devolucion_real")
    private LocalDateTime fechaDevolucionReal;

    @Column(name = "mora_aplicada", precision = 10, scale = 2, nullable = false)
    private BigDecimal moraAplicada = BigDecimal.ZERO;

    public DetalleAlquiler() {}

    public String getIdDetalle() { return idDetalle; }
    public void setIdDetalle(String idDetalle) { this.idDetalle = idDetalle; }

    public String getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(String idAlquiler) { this.idAlquiler = idAlquiler; }

    public String getIdRecurso() { return idRecurso; }
    public void setIdRecurso(String idRecurso) { this.idRecurso = idRecurso; }

    public Integer getHorasRealizadas() { return horasRealizadas; }
    public void setHorasRealizadas(Integer horasRealizadas) { this.horasRealizadas = horasRealizadas; }

    public BigDecimal getCostoParcial() { return costoParcial; }
    public void setCostoParcial(BigDecimal costoParcial) { this.costoParcial = costoParcial; }

    public LocalDateTime getFechaDevolucionReal() { return fechaDevolucionReal; }
    public void setFechaDevolucionReal(LocalDateTime fechaDevolucionReal) { this.fechaDevolucionReal = fechaDevolucionReal; }

    public BigDecimal getMoraAplicada() { return moraAplicada; }
    public void setMoraAplicada(BigDecimal moraAplicada) { this.moraAplicada = moraAplicada; }
}
