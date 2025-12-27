package com.turismo.alquilerrecursos.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ReservaRequest {
    private String idTurista;
    private LocalDateTime fechaHoraInicioPrevista;
    private String idPromocion; // opcional
    private String metodoPago; // opcional, para registrar el pago del 50%
    private String idUsuarioGestor; // opcional, si viene desde el frontend
    private List<RecursoSolicitado> recursos;

    public static class RecursoSolicitado {
        private String idRecurso;
        private Integer horasSolicitadas;

        // Getters y setters
        public String getIdRecurso() { return idRecurso; }
        public void setIdRecurso(String idRecurso) { this.idRecurso = idRecurso; }
        public Integer getHorasSolicitadas() { return horasSolicitadas; }
        public void setHorasSolicitadas(Integer horasSolicitadas) { this.horasSolicitadas = horasSolicitadas; }
    }

    // Getters y setters
    public String getIdTurista() { return idTurista; }
    public void setIdTurista(String idTurista) { this.idTurista = idTurista; }
    public LocalDateTime getFechaHoraInicioPrevista() { return fechaHoraInicioPrevista; }
    public void setFechaHoraInicioPrevista(LocalDateTime fechaHoraInicioPrevista) { this.fechaHoraInicioPrevista = fechaHoraInicioPrevista; }
    public String getIdPromocion() { return idPromocion; }
    public void setIdPromocion(String idPromocion) { this.idPromocion = idPromocion; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getIdUsuarioGestor() { return idUsuarioGestor; }
    public void setIdUsuarioGestor(String idUsuarioGestor) { this.idUsuarioGestor = idUsuarioGestor; }
    public List<RecursoSolicitado> getRecursos() { return recursos; }
    public void setRecursos(List<RecursoSolicitado> recursos) { this.recursos = recursos; }
}