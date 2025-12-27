package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.ComprobanteElectronicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comprobantes-electronicos")
public class ComprobanteElectronicoController {

    @Autowired
    private ComprobanteElectronicoService service;

    // ---- Alquiler - por idPago ----
    @GetMapping("/pago/{idPago}/ticket")
    public ResponseEntity<byte[]> ticketPorPago(@PathVariable String idPago, @RequestParam String tipo) {
        byte[] pdf = service.generarTicketPdfPorPago(idPago, tipo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "inline; filename=\"ticket_"+idPago+"_"+tipo+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/pago/{idPago}/pdf")
    public ResponseEntity<byte[]> pdfEstandarPorPago(@PathVariable String idPago, @RequestParam String tipo) {
        byte[] pdf = service.generarPdfEstandarPorPago(idPago, tipo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_"+idPago+"_"+tipo+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/pago/{idPago}/xml")
    public ResponseEntity<byte[]> xmlPorPago(@PathVariable String idPago, @RequestParam String tipo) {
        byte[] xml = service.generarXmlUblPorPago(idPago, tipo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_"+idPago+"_"+tipo+".xml\"");
        return ResponseEntity.ok().headers(headers).body(xml);
    }

    // ---- Reserva - por idPagoReserva (adelanto/cancelación) ----
    @GetMapping("/pago-reserva/{idPagoReserva}/ticket")
    public ResponseEntity<byte[]> ticketPorPagoReserva(@PathVariable String idPagoReserva, @RequestParam String tipo) {
        byte[] pdf = service.generarTicketPdfPorPagoReserva(idPagoReserva, tipo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "inline; filename=\"ticket_reserva_"+idPagoReserva+"_"+tipo+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/pago-reserva/{idPagoReserva}/pdf")
    public ResponseEntity<byte[]> pdfEstandarPorPagoReserva(@PathVariable String idPagoReserva, @RequestParam String tipo) {
        byte[] pdf = service.generarPdfEstandarPorPagoReserva(idPagoReserva, tipo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_reserva_"+idPagoReserva+"_"+tipo+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/pago-reserva/{idPagoReserva}/xml")
    public ResponseEntity<byte[]> xmlPorPagoReserva(@PathVariable String idPagoReserva, @RequestParam String tipo) {
        byte[] xml = service.generarXmlUblPorPagoReserva(idPagoReserva, tipo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_reserva_"+idPagoReserva+"_"+tipo+".xml\"");
        return ResponseEntity.ok().headers(headers).body(xml);
    }
}
