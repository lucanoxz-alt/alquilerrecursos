package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "RESERVA")
public class Reserva {

    @Id
    @Column(name = "id_reserva", columnDefinition = "CHAR(6)")
    private String idReserva;

    @Column(name = "id_turista", columnDefinition = "CHAR(6)")
    private String idTurista;

    @Column(name = "fecha_hora_inicio_prevista", nullable = false)
    private LocalDateTime fechaHoraInicioPrevista;

    @Column(name = "estadoreserva", length = 20, nullable = false)
    private String estadoreserva;

    @Column(name = "costo_total_estimado", precision = 10, scale = 2, nullable = false)
    private BigDecimal costoTotalEstimado;

    @Column(name = "fecha_cancelacion")
    private LocalDateTime fechaCancelacion;

    @Column(name = "id_usuario_cancelacion", columnDefinition = "CHAR(6)")
    private String idUsuarioCancelacion;

    @Column(name = "motivo_cancelacion", length = 255)
    private String motivoCancelacion;

    @Column(name = "id_promocion", columnDefinition = "CHAR(7)")
    private String idPromocion;

    @Column(name = "id_usuario_gestor", columnDefinition = "CHAR(6)")
    private String idUsuarioGestor;

    public Reserva() {}

    public String getIdReserva() { return idReserva; }
    public void setIdReserva(String idReserva) { this.idReserva = idReserva; }

    public String getIdTurista() { return idTurista; }
    public void setIdTurista(String idTurista) { this.idTurista = idTurista; }

    public LocalDateTime getFechaHoraInicioPrevista() { return fechaHoraInicioPrevista; }
    public void setFechaHoraInicioPrevista(LocalDateTime fechaHoraInicioPrevista) { this.fechaHoraInicioPrevista = fechaHoraInicioPrevista; }

    public String getEstadoreserva() { return estadoreserva; }
    public void setEstadoreserva(String estadoreserva) { this.estadoreserva = estadoreserva; }

    public BigDecimal getCostoTotalEstimado() { return costoTotalEstimado; }
    public void setCostoTotalEstimado(BigDecimal costoTotalEstimado) { this.costoTotalEstimado = costoTotalEstimado; }

    public LocalDateTime getFechaCancelacion() { return fechaCancelacion; }
    public void setFechaCancelacion(LocalDateTime fechaCancelacion) { this.fechaCancelacion = fechaCancelacion; }

    public String getIdUsuarioCancelacion() { return idUsuarioCancelacion; }
    public void setIdUsuarioCancelacion(String idUsuarioCancelacion) { this.idUsuarioCancelacion = idUsuarioCancelacion; }

    public String getMotivoCancelacion() { return motivoCancelacion; }
    public void setMotivoCancelacion(String motivoCancelacion) { this.motivoCancelacion = motivoCancelacion; }

    public String getIdPromocion() { return idPromocion; }
    public void setIdPromocion(String idPromocion) { this.idPromocion = idPromocion; }

    public String getIdUsuarioGestor() { return idUsuarioGestor; }
    public void setIdUsuarioGestor(String idUsuarioGestor) { this.idUsuarioGestor = idUsuarioGestor; }
}