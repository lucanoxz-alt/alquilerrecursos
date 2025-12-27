package com.turismo.alquilerrecursos.dto;

import com.turismo.alquilerrecursos.model.Alquiler;
import com.turismo.alquilerrecursos.model.Pago;
import com.turismo.alquilerrecursos.model.Reserva;

public class ConfirmacionReservaResponse {
    private Reserva reserva;
    private Alquiler alquiler;
    private Pago pago;

    public ConfirmacionReservaResponse() {}

    public ConfirmacionReservaResponse(Reserva reserva, Alquiler alquiler, Pago pago) {
        this.reserva = reserva;
        this.alquiler = alquiler;
        this.pago = pago;
    }

    public Reserva getReserva() { return reserva; }
    public void setReserva(Reserva reserva) { this.reserva = reserva; }

    public Alquiler getAlquiler() { return alquiler; }
    public void setAlquiler(Alquiler alquiler) { this.alquiler = alquiler; }

    public Pago getPago() { return pago; }
    public void setPago(Pago pago) { this.pago = pago; }
}