package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.ComprobantePagoReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comprobantes-pago-reserva")
public class ComprobantePagoReservaController {

    @Autowired private ComprobantePagoReservaService service;

    @GetMapping("/reserva/{idReserva}/pdf")
    public ResponseEntity<byte[]> pdfPorReserva(@PathVariable String idReserva) {
        Map<String,Object> data = service.generarDatosPorReserva(idReserva);
        byte[] pdf = service.generarPDF(data);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_reserva_"+idReserva+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/pago/{idPagoReserva}/pdf")
    public ResponseEntity<byte[]> pdfPorPagoReserva(@PathVariable String idPagoReserva) {
        Map<String,Object> data = service.generarDatosPorPagoReserva(idPagoReserva);
        byte[] pdf = service.generarPDF(data);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_reserva_pago_"+idPagoReserva+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
