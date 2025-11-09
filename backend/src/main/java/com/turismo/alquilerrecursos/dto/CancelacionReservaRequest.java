package com.turismo.alquilerrecursos.dto;

public class CancelacionReservaRequest {
    private String idUsuarioCancelacion;
    private String motivoCancelacion;

    // Getters y Setters
    public String getIdUsuarioCancelacion() {
        return idUsuarioCancelacion;
    }

    public void setIdUsuarioCancelacion(String idUsuarioCancelacion) {
        this.idUsuarioCancelacion = idUsuarioCancelacion;
    }

    public String getMotivoCancelacion() {
        return motivoCancelacion;
    }

    public void setMotivoCancelacion(String motivoCancelacion) {
        this.motivoCancelacion = motivoCancelacion;
    }
}