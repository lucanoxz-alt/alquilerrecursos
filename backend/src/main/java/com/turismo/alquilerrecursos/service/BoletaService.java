package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Alquiler;
import com.turismo.alquilerrecursos.model.Pago;
import com.turismo.alquilerrecursos.model.Turista;
import com.turismo.alquilerrecursos.model.DetalleAlquiler;
import com.turismo.alquilerrecursos.repository.AlquilerRepository;
import com.turismo.alquilerrecursos.repository.PagoRepository;
import com.turismo.alquilerrecursos.repository.TuristaRepository;
import com.turismo.alquilerrecursos.repository.DetalleAlquilerRepository;
import com.turismo.alquilerrecursos.repository.RecursoRepository;
import com.turismo.alquilerrecursos.model.Recurso;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.turismo.alquilerrecursos.config.EmpresaProperties;
import com.turismo.alquilerrecursos.util.NumeroALetrasUtil;
import com.turismo.alquilerrecursos.util.QrUtil;
import com.turismo.alquilerrecursos.util.HashUtil;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class BoletaService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(BoletaService.class);

    @Autowired
    private AlquilerRepository alquilerRepository;
    
    @Autowired
    private PagoRepository pagoRepository;
    
    @Autowired
    private TuristaRepository turistaRepository;
    
    @Autowired
    private DetalleAlquilerRepository detalleAlquilerRepository;

    @Autowired
    private RecursoRepository recursoRepository;

    @Autowired
    private EmpresaProperties empresaProperties;

    /**
     * Generar datos de boleta para un alquiler
     */
    public Map<String, Object> generarDatosBoleta(String idAlquiler) {
        Map<String, Object> datosBoleta = new HashMap<>();
        
        // Obtener alquiler
        Alquiler alquiler = alquilerRepository.findById(idAlquiler)
                .orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        
        // Obtener turista
        Turista turista = turistaRepository.findById(alquiler.getIdTurista())
                .orElseThrow(() -> new RuntimeException("Turista no encontrado: " + alquiler.getIdTurista()));
        
        // Obtener pago (si no existe, seguimos con valores por defecto para no romper la boleta)
        Pago pago = pagoRepository.findByIdAlquiler(idAlquiler);
        boolean sinPago = (pago == null);
        
        // Obtener detalles del alquiler
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(idAlquiler);
        
        // Calcular fecha fin si es null y formatear fechas
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        
        // Datos de la empresa (desde configuración)
        Map<String, Object> empresa = new HashMap<>();
        empresa.put("nombre", empresaProperties.getNombre());
        empresa.put("ruc", empresaProperties.getRuc());
        empresa.put("direccion", empresaProperties.getDireccion());
        empresa.put("telefono", empresaProperties.getTelefono());
        empresa.put("email", empresaProperties.getEmail());
        
        // Datos del alquiler
        Map<String, Object> datosAlquiler = new HashMap<>();
        datosAlquiler.put("id", alquiler.getIdAlquiler());
        datosAlquiler.put("fechaInicio", alquiler.getFechaHoraInicio() != null ? alquiler.getFechaHoraInicio().format(formatter) : "N/D");
        datosAlquiler.put("duracionHoras", alquiler.getDuracionHoras());
        LocalDateTime fechaFinCalc = alquiler.getFechaHoraFin();
        if (fechaFinCalc == null && alquiler.getFechaHoraInicio() != null && alquiler.getDuracionHoras() != null) {
            fechaFinCalc = alquiler.getFechaHoraInicio().plusHours(alquiler.getDuracionHoras());
        }
        datosAlquiler.put("fechaFin", fechaFinCalc != null ? fechaFinCalc.format(formatter) : "");
        datosAlquiler.put("estado", alquiler.getEstadoalquiler() != null ? alquiler.getEstadoalquiler() : "N/D");
        datosAlquiler.put("idVendedor", alquiler.getIdUsuarioGestor() != null ? alquiler.getIdUsuarioGestor() : "");
        
        // Datos del turista
        Map<String, Object> datosTurista = new HashMap<>();
        datosTurista.put("nombres", turista.getNombres());
        datosTurista.put("apellidos", turista.getApellidos());
        datosTurista.put("documento", turista.getDniPasaporte());
        datosTurista.put("nacionalidad", turista.getNacionalidad());
        datosTurista.put("telefono", turista.getTelefono());
        datosTurista.put("email", turista.getEmail());
        
        // Datos del pago
        Map<String, Object> datosPago = new HashMap<>();
        if (!sinPago) {
            datosPago.put("numBoleta", pago.getNumBoleta() != null ? pago.getNumBoleta() : "N/D");
            datosPago.put("fechaEmision", pago.getFechaEmision() != null ? pago.getFechaEmision().format(formatter) : "N/D");
            datosPago.put("subtotal", pago.getSubtotal() != null ? pago.getSubtotal() : java.math.BigDecimal.ZERO);
            datosPago.put("descuento", pago.getDescuentoAplicado() != null ? pago.getDescuentoAplicado() : java.math.BigDecimal.ZERO);
            datosPago.put("totalFinal", pago.getTotalFinal() != null ? pago.getTotalFinal() : java.math.BigDecimal.ZERO);
            datosPago.put("montoPagado", pago.getMontoPagado() != null ? pago.getMontoPagado() : java.math.BigDecimal.ZERO);
            datosPago.put("metodoPago", pago.getMetodoPago() != null ? pago.getMetodoPago() : "N/D");
            // IGV y letras
            java.math.BigDecimal subtotal = pago.getSubtotal() != null ? pago.getSubtotal() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal totalFinal = pago.getTotalFinal() != null ? pago.getTotalFinal() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal igv = totalFinal.subtract(subtotal);
            datosPago.put("igv", igv);
            datosPago.put("totalEnLetras", NumeroALetrasUtil.aMonedaPeru(totalFinal));
            // QR y hash
            String qrContent = "ALQ:"+idAlquiler+"|BOLETA:"+(pago.getNumBoleta() != null ? pago.getNumBoleta() : "N/D")+"|TOTAL:"+totalFinal;
            try {
                datosPago.put("qrDataUri", QrUtil.generarQrDataUri(qrContent, 120));
            } catch (Exception e) {
                logger.warn("No se pudo generar QR para pago de {}: {}", idAlquiler, e.getMessage());
            }
            try {
                datosPago.put("hash", HashUtil.sha256((pago.getNumBoleta() != null ? pago.getNumBoleta() : "")+"|"+idAlquiler));
            } catch (Exception e) {
                logger.warn("No se pudo generar hash para pago de {}: {}", idAlquiler, e.getMessage());
            }
        } else {
            java.math.BigDecimal costo = alquiler.getCostoTotal() != null ? alquiler.getCostoTotal() : java.math.BigDecimal.ZERO;
            datosPago.put("numBoleta", "N/D");
            datosPago.put("fechaEmision", LocalDateTime.now().format(formatter));
            datosPago.put("subtotal", costo);
            datosPago.put("descuento", java.math.BigDecimal.ZERO);
            datosPago.put("totalFinal", costo);
            datosPago.put("montoPagado", costo);
            datosPago.put("metodoPago", "N/D");
        }
        
        // Estructurar respuesta
        datosBoleta.put("empresa", empresa);
        datosBoleta.put("alquiler", datosAlquiler);
        datosBoleta.put("turista", datosTurista);
        datosBoleta.put("pago", datosPago);
        datosBoleta.put("detalles", detalles);
        datosBoleta.put("fechaGeneracion", LocalDateTime.now().format(formatter));
        
        return datosBoleta;
    }

    /**
     * Generar boleta en formato HTML (para PDF)
     */
    public String generarBoletaHTML(String idAlquiler) {
        try {
            Map<String, Object> datos = generarDatosBoleta(idAlquiler);
            
            StringBuilder html = new StringBuilder();
            html.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            html.append("<!DOCTYPE html>");
            html.append("<html xmlns='http://www.w3.org/1999/xhtml' lang='es'>");
            html.append("<head>");
            html.append("<meta charset='UTF-8' />");
            html.append("<title>Boleta de Alquiler</title>");
            html.append("<style>");
            html.append("body { font-family: Arial, sans-serif; margin: 20px; }");
            html.append(".header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }");
            html.append(".section { margin: 20px 0; }");
            html.append(".table { width: 100%; border-collapse: collapse; }");
            html.append(".table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
            html.append(".table th { background-color: #f2f2f2; }");
            html.append(".total { font-weight: bold; font-size: 18px; }");
            html.append("</style>");
            html.append("</head>");
            html.append("<body>");
            
            // Header de la empresa con formato tipo ticket
            Map<String, Object> empresa = (Map<String, Object>) datos.get("empresa");
            html.append("<div style='display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #333;padding-bottom:8px'>");
            html.append("<div>");
            html.append("<div style='font-weight:bold;font-size:16px'>").append(String.valueOf(empresa.get("nombre"))).append("</div>");
            html.append("<div style='font-size:12px'>RUC ").append(String.valueOf(empresa.get("ruc"))).append("</div>");
            html.append("<div style='font-size:12px'>").append(String.valueOf(empresa.get("direccion"))).append("</div>");
            html.append("<div style='font-size:12px'>").append(String.valueOf(empresa.get("telefono"))).append(" | ").append(String.valueOf(empresa.get("email"))).append("</div>");
            html.append("</div>");
            html.append("<div style='text-align:right'>");
            html.append("<div style='font-weight:bold'>FACTURA ELECTRÓNICA</div>");
            Map<String, Object> pago = (Map<String, Object>) datos.get("pago");
            html.append("<div style='font-size:12px'>N° ").append(String.valueOf(pago.get("numBoleta"))).append("</div>");
            html.append("</div></div>");
            
            // Datos del alquiler y cliente
            Map<String, Object> alquiler = (Map<String, Object>) datos.get("alquiler");
            Map<String, Object> turista = (Map<String, Object>) datos.get("turista");
            html.append("<div style='margin-top:8px;display:flex;justify-content:space-between'>");
            html.append("<div>");
            html.append("<div><strong>Cliente:</strong> ").append(String.valueOf(turista.get("nombres"))).append(" ").append(String.valueOf(turista.get("apellidos"))).append("</div>");
            html.append("<div><strong>DNI/RUC:</strong> ").append(String.valueOf(turista.get("documento"))).append("</div>");
            html.append("</div>");
            html.append("<div style='text-align:right'>");
            html.append("<div><strong>Fecha emisión:</strong> ").append(String.valueOf(pago.get("fechaEmision"))).append("</div>");
            html.append("<div><strong>Orden compra:</strong> ").append(String.valueOf(alquiler.get("id"))).append("</div>");
            html.append("<div><strong>ID Vendedor:</strong> ").append(String.valueOf(alquiler.getOrDefault("idVendedor",""))).append("</div>");
            html.append("</div></div>");
            
            // Detalle de items
            java.util.List<com.turismo.alquilerrecursos.model.DetalleAlquiler> detalles = (java.util.List<com.turismo.alquilerrecursos.model.DetalleAlquiler>) datos.get("detalles");
            html.append("<table class='table' style='margin-top:10px;font-size:12px'>");
            html.append("<thead><tr><th>CANT.</th><th>UNIDAD</th><th>DESCRIPCIÓN</th><th style='text-align:right'>P. UNIT.</th><th style='text-align:right'>DTO.</th><th style='text-align:right'>TOTAL</th></tr></thead><tbody>");
            for (com.turismo.alquilerrecursos.model.DetalleAlquiler d : detalles) {
                com.turismo.alquilerrecursos.model.Recurso r = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                java.math.BigDecimal pUnit = r != null ? r.getTarifaHora() : java.math.BigDecimal.ZERO;
                String desc = (r != null ? r.getNombre() : d.getIdRecurso()) + (r != null && r.getDescripcion()!=null? " ("+r.getDescripcion()+")":"");
                html.append("<tr>")
                    .append("<td>").append(d.getHorasRealizadas()).append("</td>")
                    .append("<td>HORA</td>")
                    .append("<td>").append(desc).append("</td>")
                    .append("<td style='text-align:right'>").append(pUnit).append("</td>")
                    .append("<td style='text-align:right'>0</td>")
                    .append("<td style='text-align:right'>").append(d.getCostoParcial()).append("</td>")
                    .append("</tr>");
            }
            html.append("</tbody></table>");
            
            // Resumen financiero y en letras, QR y hash si existen
            java.math.BigDecimal sub = toBigDecimalSafe(pago.get("subtotal"));
            java.math.BigDecimal tot = toBigDecimalSafe(pago.get("totalFinal"));
            java.math.BigDecimal igv = toBigDecimalSafe(pago.getOrDefault("igv", java.math.BigDecimal.ZERO));
            Object letras = pago.getOrDefault("totalEnLetras", "");
            Object qr = pago.getOrDefault("qrDataUri", null);
            Object hash = pago.getOrDefault("hash", null);
            html.append("<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px'>");
            html.append("<div>");
            if (qr != null) {
                html.append("<img src='").append(qr).append("' width='120' height='120'/>");
            }
            if (hash != null) {
                html.append("<div style='font-size:11px;color:#555'>HASH: ").append(hash).append("</div>");
            }
            html.append("</div>");
            html.append("<div style='width:45%'>");
            html.append("<table class='table' style='font-size:12px'>");
            html.append("<tr><td>OP. GRAVADAS</td><td style='text-align:right'>").append(sub).append("</td></tr>");
            html.append("<tr><td>IGV (18%)</td><td style='text-align:right'>").append(igv).append("</td></tr>");
            html.append("<tr><th>TOTAL A PAGAR</th><th style='text-align:right'>").append(tot).append("</th></tr>");
            html.append("</table>");
            if (letras != null && !letras.toString().isEmpty()) {
                html.append("<div style='font-size:12px;color:#555'>Son: ").append(letras).append("</div>");
            }
            html.append("</div></div>");
            
            html.append("<div class='section' style='margin-top:8px'><em>Gracias por su preferencia!</em></div>");
            
            html.append("</body>");
            html.append("</html>");
            
            return html.toString();
        } catch (Exception e) {
            logger.error("Error generando HTML de boleta para {}: {}", idAlquiler, e.getMessage(), e);
            throw new RuntimeException("Error generando HTML de boleta para " + idAlquiler + ": " + e.getMessage(), e);
        }
    }

    private static java.math.BigDecimal toBigDecimalSafe(Object o) {
        if (o == null) return java.math.BigDecimal.ZERO;
        if (o instanceof java.math.BigDecimal) return (java.math.BigDecimal) o;
        if (o instanceof Number) return new java.math.BigDecimal(((Number) o).toString());
        try {
            return new java.math.BigDecimal(o.toString());
        } catch (Exception e) {
            return java.math.BigDecimal.ZERO;
        }
    }

    /**
     * Generar boleta en PDF (bytes) usando OpenHTMLToPDF
     */
    public byte[] generarBoletaPDF(String idAlquiler) {
        String html = generarBoletaHTML(idAlquiler);
        // write HTML to temp file for debugging
        try {
            java.nio.file.Path tmp = java.nio.file.Files.createTempFile("boleta_" + idAlquiler + "_", ".html");
            java.nio.file.Files.writeString(tmp, html, java.nio.charset.StandardCharsets.UTF_8);
            logger.info("Boleta HTML escrita en archivo temporal: {} (longitud={})", tmp.toString(), html.length());
        } catch (Exception ex) {
            logger.warn("No se pudo escribir archivo temporal del HTML de boleta {}: {}", idAlquiler, ex.getMessage());
        }

        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            logger.info("Iniciando generación de PDF para boleta {} (HTML length={})", idAlquiler, html.length());
            com.openhtmltopdf.pdfboxout.PdfRendererBuilder builder = new com.openhtmltopdf.pdfboxout.PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            logger.info("Generación de PDF completada para boleta {} (bytes={})", idAlquiler, os.size());
            return os.toByteArray();
        } catch (Exception e) {
            logger.error("Error generando PDF para boleta {}: {}", idAlquiler, e.getMessage(), e);
            throw new RuntimeException("Error generando PDF de boleta: " + e.getMessage(), e);
        }
    }
}