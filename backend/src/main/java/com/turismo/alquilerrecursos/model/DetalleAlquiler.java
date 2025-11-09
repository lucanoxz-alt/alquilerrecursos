package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

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
    private Integer horasRealizadas;

    @Column(name = "costo_parcial", precision = 10, scale = 2, nullable = false)
    private BigDecimal costoParcial;

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
}