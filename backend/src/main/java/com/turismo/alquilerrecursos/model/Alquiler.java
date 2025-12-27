package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ALQUILER")
public class Alquiler {

    @Id
    @Column(name = "id_alquiler", columnDefinition = "CHAR(6)")
    private String idAlquiler;

    @Column(name = "id_turista", columnDefinition = "CHAR(6)")
    private String idTurista;

    @Column(name = "id_usuario_gestor", columnDefinition = "CHAR(6)")
    private String idUsuarioGestor;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(name = "duracion_horas", nullable = false)
    private Integer duracionHoras;

    @Column(name = "fecha_hora_fin", nullable = true, insertable = false, updatable = false)
    private LocalDateTime fechaHoraFin;

    @Column(name = "costo_total", precision = 10, scale = 2, nullable = false)
    private BigDecimal costoTotal;

    @Column(name = "estadoalquiler", length = 20, nullable = false)
    private String estadoalquiler;

    @Column(name = "id_reserva", columnDefinition = "CHAR(6)")
    private String idReserva;

    @Column(name = "id_promocion", columnDefinition = "CHAR(7)")
    private String idPromocion;

    public Alquiler() {}

    public String getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(String idAlquiler) { this.idAlquiler = idAlquiler; }

    public String getIdTurista() { return idTurista; }
    public void setIdTurista(String idTurista) { this.idTurista = idTurista; }

    public String getIdUsuarioGestor() { return idUsuarioGestor; }
    public void setIdUsuarioGestor(String idUsuarioGestor) { this.idUsuarioGestor = idUsuarioGestor; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public Integer getDuracionHoras() { return duracionHoras; }
    public void setDuracionHoras(Integer duracionHoras) { this.duracionHoras = duracionHoras; }

    public LocalDateTime getFechaHoraFin() { return fechaHoraFin; }
    public void setFechaHoraFin(LocalDateTime fechaHoraFin) { this.fechaHoraFin = fechaHoraFin; }

    public BigDecimal getCostoTotal() { return costoTotal; }
    public void setCostoTotal(BigDecimal costoTotal) { this.costoTotal = costoTotal; }

    public String getEstadoalquiler() { return estadoalquiler; }
    public void setEstadoalquiler(String estadoalquiler) { this.estadoalquiler = estadoalquiler; }

    public String getIdReserva() { return idReserva; }
    public void setIdReserva(String idReserva) { this.idReserva = idReserva; }

    public String getIdPromocion() { return idPromocion; }
    public void setIdPromocion(String idPromocion) { this.idPromocion = idPromocion; }
}