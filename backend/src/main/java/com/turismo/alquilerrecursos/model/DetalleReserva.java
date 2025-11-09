package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;

@Entity
@Table(name = "DETALLE_RESERVA")
public class DetalleReserva {

    @Id
    @Column(name = "id_detalle_reserva", columnDefinition = "CHAR(6)")
    private String idDetalleReserva;

    @Column(name = "id_reserva", columnDefinition = "CHAR(6)")
    private String idReserva;

    @Column(name = "id_recurso", columnDefinition = "CHAR(6)")
    private String idRecurso;

    @Column(name = "horas_solicitadas", nullable = false)
    private Integer horasSolicitadas;

    public DetalleReserva() {}

    public String getIdDetalleReserva() { return idDetalleReserva; }
    public void setIdDetalleReserva(String idDetalleReserva) { this.idDetalleReserva = idDetalleReserva; }

    public String getIdReserva() { return idReserva; }
    public void setIdReserva(String idReserva) { this.idReserva = idReserva; }

    public String getIdRecurso() { return idRecurso; }
    public void setIdRecurso(String idRecurso) { this.idRecurso = idRecurso; }

    public Integer getHorasSolicitadas() { return horasSolicitadas; }
    public void setHorasSolicitadas(Integer horasSolicitadas) { this.horasSolicitadas = horasSolicitadas; }
}