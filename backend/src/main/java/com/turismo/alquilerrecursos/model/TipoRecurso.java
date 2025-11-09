package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;

@Entity
@Table(name = "TIPO_RECURSO")
public class TipoRecurso {

    @Id
    @Column(name = "id_tipo", columnDefinition = "CHAR(5)")
    private String idTipo;

    @Column(name = "nombre", length = 100, nullable = false, unique = true)
    private String nombre;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    // Constructores
    public TipoRecurso() {}

    // Getters y Setters
    public String getIdTipo() { return idTipo; }
    public void setIdTipo(String idTipo) { this.idTipo = idTipo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}