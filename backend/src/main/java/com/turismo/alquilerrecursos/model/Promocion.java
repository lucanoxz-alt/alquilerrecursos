package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

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

    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }
}