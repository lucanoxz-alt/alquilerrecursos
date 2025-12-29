package com.turismo.alquilerrecursos.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AlquilerListadoDTO {
    private String idAlquiler;
    private String idTurista;
    private String nombreCliente;
    private LocalDateTime fechaHoraInicio;
    private String fechaHoraInicioFmt;
    private Integer duracionHoras;
    private BigDecimal costoTotal;
    private String estadoalquiler;
    // Nuevos campos para recursos
    private java.util.List<String> nombresRecursos;
    private Integer cantidadRecursos;

    public AlquilerListadoDTO() {}

    public AlquilerListadoDTO(String idAlquiler, String idTurista, String nombreCliente,
                              LocalDateTime fechaHoraInicio, Integer duracionHoras,
                              BigDecimal costoTotal, String estadoalquiler,
                              java.util.List<String> nombresRecursos, Integer cantidadRecursos) {
        this.idAlquiler = idAlquiler;
        this.idTurista = idTurista;
        this.nombreCliente = nombreCliente;
        this.fechaHoraInicio = fechaHoraInicio;
        this.duracionHoras = duracionHoras;
        this.costoTotal = costoTotal;
        this.estadoalquiler = estadoalquiler;
        this.nombresRecursos = nombresRecursos;
        this.cantidadRecursos = cantidadRecursos;
    }

    public String getFechaHoraInicioFmt() { return fechaHoraInicioFmt; }
    public void setFechaHoraInicioFmt(String fechaHoraInicioFmt) { this.fechaHoraInicioFmt = fechaHoraInicioFmt; }

    public String getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(String idAlquiler) { this.idAlquiler = idAlquiler; }

    public String getIdTurista() { return idTurista; }
    public void setIdTurista(String idTurista) { this.idTurista = idTurista; }

    public String getNombreCliente() { return nombreCliente; }
    public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public Integer getDuracionHoras() { return duracionHoras; }
    public void setDuracionHoras(Integer duracionHoras) { this.duracionHoras = duracionHoras; }

    public BigDecimal getCostoTotal() { return costoTotal; }
    public void setCostoTotal(BigDecimal costoTotal) { this.costoTotal = costoTotal; }

    public String getEstadoalquiler() { return estadoalquiler; }
    public void setEstadoalquiler(String estadoalquiler) { this.estadoalquiler = estadoalquiler; }

    public java.util.List<String> getNombresRecursos() { return nombresRecursos; }
    public void setNombresRecursos(java.util.List<String> nombresRecursos) { this.nombresRecursos = nombresRecursos; }

    public Integer getCantidadRecursos() { return cantidadRecursos; }
    public void setCantidadRecursos(Integer cantidadRecursos) { this.cantidadRecursos = cantidadRecursos; }
}
