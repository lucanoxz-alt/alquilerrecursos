package com.turismo.alquilerrecursos.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class ComprobanteElectronicoService {

    @Autowired private ComprobantePagoService comprobantePagoService;
    @Autowired private ComprobantePagoReservaService comprobantePagoReservaService;

    public byte[] generarTicketPdfPorPago(String idPago, String tipo) {
        Map<String,Object> data = comprobantePagoService.generarDatosComprobantePagoPorPago(idPago);
        return comprobantePagoService.generarTicketPDFDesdeDatos(data);
    }

    public byte[] generarPdfEstandarPorPago(String idPago, String tipo) {
        Map<String,Object> data = comprobantePagoService.generarDatosComprobantePagoPorPago(idPago);
        return comprobantePagoService.generarPDFDesdeDatos(data);
    }

    public byte[] generarTicketPdfPorPagoReserva(String idPagoReserva, String tipo) {
        Map<String,Object> data = comprobantePagoReservaService.generarDatosPorPagoReserva(idPagoReserva);
        return comprobantePagoReservaService.generarTicketPDF(data);
    }

    public byte[] generarPdfEstandarPorPagoReserva(String idPagoReserva, String tipo) {
        Map<String,Object> data = comprobantePagoReservaService.generarDatosPorPagoReserva(idPagoReserva);
        return comprobantePagoReservaService.generarPDF(data);
    }
}