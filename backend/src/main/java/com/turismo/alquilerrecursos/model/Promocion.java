package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "PROMOCION")
public class Promocion {

    @Id
    @Column(name = "id_promocion", columnDefinition = "CHAR(7)")
    private String idPromocion;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "condicion_minima", nullable = false)
    private Integer condicionMinima;

    @Column(name = "porcentaje_desc", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcentajeDesc;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "activa", nullable = false)
    private Boolean activa;

    public Promocion() {}

    public String getIdPromocion() { return idPromocion; }
    public void setIdPromocion(String idPromocion) { this.idPromocion = idPromocion; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCondicionMinima() { return condicionMinima; }
    public void setCondicionMinima(Integer condicionMinima) { this.condicionMinima = condicionMinima; }

    public BigDecimal getPorcentajeDesc() { return porcentajeDesc; }
    public void setPorcentajeDesc(BigDecimal porcentajeDesc) { this.porcentajeDesc = porcentajeDesc; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }
}