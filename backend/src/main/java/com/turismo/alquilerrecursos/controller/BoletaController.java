package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.BoletaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/boletas")
public class BoletaController {

    @Autowired
    private BoletaService boletaService;

    /**
     * Obtener datos de boleta en formato JSON
     */
    @GetMapping("/{idAlquiler}/datos")
    public ResponseEntity<Map<String, Object>> obtenerDatosBoleta(@PathVariable String idAlquiler) {
        try {
            Map<String, Object> datos = boletaService.generarDatosBoleta(idAlquiler);
            return ResponseEntity.ok(datos);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Generar boleta en formato HTML
     */
    @GetMapping("/{idAlquiler}/html")
    public ResponseEntity<String> generarBoletaHTML(@PathVariable String idAlquiler) {
        try {
            String html = boletaService.generarBoletaHTML(idAlquiler);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            headers.set("Content-Disposition", "inline; filename=\"boleta_" + idAlquiler + ".html\"");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(html);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("<html><body><h1>Error: " + e.getMessage() + "</h1></body></html>");
        }
    }

    /**
     * Descargar boleta como archivo HTML
     */
    @GetMapping("/{idAlquiler}/descargar")
    public ResponseEntity<String> descargarBoleta(@PathVariable String idAlquiler) {
        try {
            String html = boletaService.generarBoletaHTML(idAlquiler);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.set("Content-Disposition", "attachment; filename=\"boleta_" + idAlquiler + ".html\"");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(html);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("<html><body><h1>Error: " + e.getMessage() + "</h1></body></html>");
        }
    }

    /**
     * Generar boleta en PDF
     */
    @GetMapping("/{idAlquiler}/pdf")
    public ResponseEntity<byte[]> generarBoletaPDF(@PathVariable String idAlquiler) {
        try {
            byte[] pdf = boletaService.generarBoletaPDF(idAlquiler);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set("Content-Disposition", "attachment; filename=\"boleta_" + idAlquiler + ".pdf\"");
            return ResponseEntity.ok().headers(headers).body(pdf);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(("Error generando PDF: " + e.getMessage()).getBytes());
        }
    }
}