package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "RECURSO")
public class Recurso {

    @Id
    @Column(name = "id_recurso", columnDefinition = "CHAR(6)")
    private String idRecurso;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "tarifa_hora", precision = 10, scale = 2, nullable = false)
    private BigDecimal tarifaHora;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado;

    @Column(name = "ubicacion", length = 255)
    private String ubicacion;

    @Column(name = "id_tipo", columnDefinition = "CHAR(5)")
    private String idTipo;

    public Recurso() {}

    public String getIdRecurso() { return idRecurso; }
    public void setIdRecurso(String idRecurso) { this.idRecurso = idRecurso; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getTarifaHora() { return tarifaHora; }
    public void setTarifaHora(BigDecimal tarifaHora) { this.tarifaHora = tarifaHora; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }

    public String getIdTipo() { return idTipo; }
    public void setIdTipo(String idTipo) { this.idTipo = idTipo; }
}