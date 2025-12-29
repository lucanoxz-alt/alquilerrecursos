package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.ComprobantePagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comprobantes-pago")
public class ComprobantePagoController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ComprobantePagoController.class);

    @Autowired private ComprobantePagoService service;

    @GetMapping("/pago/{idPago}/datos")
    public ResponseEntity<Map<String,Object>> datosPorPago(@PathVariable String idPago) {
        return ResponseEntity.ok(service.generarDatosComprobantePagoPorPago(idPago));
    }

    @GetMapping("/alquiler/{idAlquiler}/datos")
    public ResponseEntity<Map<String,Object>> datosPorAlquiler(@PathVariable String idAlquiler) {
        return ResponseEntity.ok(service.generarDatosComprobantePagoPorAlquiler(idAlquiler));
    }

    @GetMapping("/pago/{idPago}/pdf")
    public ResponseEntity<byte[]> pdfPorPago(@PathVariable String idPago) {
        logger.info("Solicitud PDF comprobante por pago: {} (Authorization: {})", idPago, "[omitted]");
        Map<String,Object> data = service.generarDatosComprobantePagoPorPago(idPago);
        byte[] pdf = service.generarPDFDesdeDatos(data);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_"+idPago+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping("/alquiler/{idAlquiler}/pdf")
    public ResponseEntity<byte[]> pdfPorAlquiler(@PathVariable String idAlquiler) {
        logger.info("Solicitud PDF comprobante por alquiler: {} (Authorization: {})", idAlquiler, "[omitted]");
        Map<String,Object> data = service.generarDatosComprobantePagoPorAlquiler(idAlquiler);
        byte[] pdf = service.generarPDFDesdeDatos(data);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("Content-Disposition", "attachment; filename=\"comprobante_"+idAlquiler+".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
