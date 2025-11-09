package com.turismo.alquilerrecursos.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AlquilerRequest {
    private String idTurista;
    private String idReserva; // opcional (si viene de una reserva)
    private LocalDateTime fechaHoraInicio;
    private String idPromocion; // opcional
    private String metodoPago;
    private List<RecursoSolicitado> recursos;

    public static class RecursoSolicitado {
        private String idRecurso;
        private Integer horasSolicitadas;

        public String getIdRecurso() { return idRecurso; }
        public void setIdRecurso(String idRecurso) { this.idRecurso = idRecurso; }
        public Integer getHorasSolicitadas() { return horasSolicitadas; }
        public void setHorasSolicitadas(Integer horasSolicitadas) { this.horasSolicitadas = horasSolicitadas; }
    }

    public String getIdTurista() { return idTurista; }
    public void setIdTurista(String idTurista) { this.idTurista = idTurista; }

    public String getIdReserva() { return idReserva; }
    public void setIdReserva(String idReserva) { this.idReserva = idReserva; }

    public LocalDateTime getFechaHoraInicio() { return fechaHoraInicio; }
    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }

    public String getIdPromocion() { return idPromocion; }
    public void setIdPromocion(String idPromocion) { this.idPromocion = idPromocion; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public List<RecursoSolicitado> getRecursos() { return recursos; }
    public void setRecursos(List<RecursoSolicitado> recursos) { this.recursos = recursos; }
}