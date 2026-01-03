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
import com.turismo.alquilerrecursos.repository.UsuarioRepository;
import com.turismo.alquilerrecursos.repository.PromocionRepository;
import com.turismo.alquilerrecursos.model.Usuario;
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

import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.UnitValue;

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
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaProperties empresaProperties;

    @Autowired
    private PromocionRepository promocionRepository;

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
        datosAlquiler.put("idReserva", alquiler.getIdReserva());
        datosAlquiler.put("fechaInicio", alquiler.getFechaHoraInicio() != null ? alquiler.getFechaHoraInicio().format(formatter) : "N/D");
        datosAlquiler.put("duracionHoras", alquiler.getDuracionHoras());
        LocalDateTime fechaFinCalc = alquiler.getFechaHoraFin();
        if (fechaFinCalc == null && alquiler.getFechaHoraInicio() != null && alquiler.getDuracionHoras() != null) {
            fechaFinCalc = alquiler.getFechaHoraInicio().plusHours(alquiler.getDuracionHoras());
        }
        datosAlquiler.put("fechaFin", fechaFinCalc != null ? fechaFinCalc.format(formatter) : "");
        datosAlquiler.put("estado", alquiler.getEstadoalquiler() != null ? alquiler.getEstadoalquiler() : "N/D");
        String idVendedor = alquiler.getIdUsuarioGestor();
        datosAlquiler.put("idVendedor", idVendedor != null ? idVendedor : "");
        
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
            java.math.BigDecimal totalFinal = pago.getTotalFinal() != null ? pago.getTotalFinal() : java.math.BigDecimal.ZERO;
            // Calcular gravadas e IGV asumiendo que el precio ya incluye IGV (18%)
            java.math.BigDecimal rate = empresaProperties.getIgvRate() != null ? empresaProperties.getIgvRate() : new java.math.BigDecimal("0.18");
            java.math.BigDecimal divisor = java.math.BigDecimal.ONE.add(rate);
            java.math.BigDecimal gravadas = totalFinal.divide(divisor, 2, java.math.RoundingMode.HALF_UP);
            java.math.BigDecimal igv = totalFinal.subtract(gravadas);
            datosPago.put("subtotal", gravadas);
            datosPago.put("igv", igv);
            datosPago.put("totalEnLetras", NumeroALetrasUtil.aMonedaPeru(totalFinal));
            // Detalle de descuento (opcional)
            if (pago.getDescuentoAplicado() != null && pago.getDescuentoAplicado().compareTo(java.math.BigDecimal.ZERO) > 0) {
                Map<String,Object> d = new HashMap<>();
                try {
                    String idProm = alquiler.getIdPromocion();
                    if (idProm != null) {
                        var prom = promocionRepository.findById(idProm).orElse(null);
                        if (prom != null) {
                            d.put("descripcion", prom.getNombre() != null && !prom.getNombre().isBlank() ? prom.getNombre() : prom.getDescripcion());
                        }
                    }
                } catch (Exception ignored) {}
                d.put("monto", pago.getDescuentoAplicado());
                datosPago.put("descuentoDetalle", d);
            }
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
            java.math.BigDecimal rate = empresaProperties.getIgvRate() != null ? empresaProperties.getIgvRate() : new java.math.BigDecimal("0.18");
            java.math.BigDecimal divisor = java.math.BigDecimal.ONE.add(rate);
            java.math.BigDecimal gravadas = costo.divide(divisor, 2, java.math.RoundingMode.HALF_UP);
            java.math.BigDecimal igv = costo.subtract(gravadas);
            datosPago.put("numBoleta", "N/D");
            datosPago.put("fechaEmision", LocalDateTime.now().format(formatter));
            datosPago.put("subtotal", gravadas);
            datosPago.put("descuento", java.math.BigDecimal.ZERO);
            datosPago.put("totalFinal", costo);
            datosPago.put("montoPagado", costo);
            datosPago.put("metodoPago", "N/D");
            datosPago.put("igv", igv);
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
        Map<String,Object> datos = generarDatosBoleta(idAlquiler);
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf, com.itextpdf.kernel.geom.PageSize.A4.rotate());
            doc.setMargins(36, 36, 36, 36);

            Map<String,Object> empresa = (Map<String,Object>) datos.get("empresa");
            Map<String,Object> alquiler = (Map<String,Object>) datos.get("alquiler");
            Map<String,Object> turista = (Map<String,Object>) datos.get("turista");
            Map<String,Object> pago = (Map<String,Object>) datos.get("pago");
            java.util.List<com.turismo.alquilerrecursos.model.DetalleAlquiler> detalles = (java.util.List<com.turismo.alquilerrecursos.model.DetalleAlquiler>) datos.get("detalles");

            // Encabezado compacto con logo y datos empresa
            com.itextpdf.layout.element.Table header = new com.itextpdf.layout.element.Table(new float[]{1,6}).setWidth(UnitValue.createPercentValue(100f));
            try {
                com.itextpdf.io.image.ImageData logoData = com.itextpdf.io.image.ImageDataFactory.create(getClass().getResource("/static/favicon-96x96.png"));
                com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(logoData).scaleToFit(50, 50);
                header.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).add(logo));
            } catch (Exception e) {
                header.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            }
            com.itextpdf.layout.element.Paragraph datosEmp = new com.itextpdf.layout.element.Paragraph()
                .add(new com.itextpdf.layout.element.Text(String.valueOf(empresa.get("nombre"))).setBold().setFontSize(12)).add("\n")
                .add("RUC "+String.valueOf(empresa.get("ruc"))).add("\n")
                .add(String.valueOf(empresa.get("direccion"))).add("\n")
                .add(String.valueOf(empresa.get("telefono"))+" | "+String.valueOf(empresa.get("email")));
            header.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).add(datosEmp));
            doc.add(header);
            doc.add(new com.itextpdf.layout.element.Paragraph("BOLETA ELECTRÓNICA").setBold());
            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + String.valueOf(pago.get("numBoleta"))));

            doc.add(new com.itextpdf.layout.element.Paragraph("Cliente: " + String.valueOf(turista.get("nombres")) + " " + String.valueOf(turista.get("apellidos"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("DNI/RUC: " + String.valueOf(turista.get("documento"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha emisión: " + String.valueOf(pago.get("fechaEmision"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Orden de Alquiler: " + String.valueOf(alquiler.get("id"))));
            if (alquiler.get("idReserva") != null && !String.valueOf(alquiler.get("idReserva")).isBlank()) {
                doc.add(new com.itextpdf.layout.element.Paragraph("ID Reserva: " + String.valueOf(alquiler.get("idReserva"))));
            }
            if (alquiler.get("idVendedor") != null && !String.valueOf(alquiler.get("idVendedor")).isBlank()) {
                doc.add(new com.itextpdf.layout.element.Paragraph("ID Vendedor: " + String.valueOf(alquiler.get("idVendedor"))));
            }
            doc.add(new com.itextpdf.layout.element.Paragraph("Método de pago: " + String.valueOf(pago.getOrDefault("metodoPago",""))));

            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(new float[]{1,2,5,2,2,2}).setWidth(UnitValue.createPercentValue(100f));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("CANT.").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("HORA").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("DESCRIPCIÓN").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("P. UNIT.").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("DTO.").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL").setBold()));

            for (com.turismo.alquilerrecursos.model.DetalleAlquiler d : detalles) {
                com.turismo.alquilerrecursos.model.Recurso r = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                java.math.BigDecimal pUnit = r != null ? r.getTarifaHora() : java.math.BigDecimal.ZERO;
                String desc = (r != null ? r.getNombre() : d.getIdRecurso()) + (r != null && r.getDescripcion()!=null? " ("+r.getDescripcion()+")":"");
                table.addCell(String.valueOf(d.getHorasRealizadas()));
                table.addCell("HORA");
                table.addCell(desc);
                table.addCell(String.valueOf(pUnit));
                table.addCell("0");
                table.addCell(String.valueOf(d.getCostoParcial()));
            }
            java.math.BigDecimal sub = toBigDecimalSafe(pago.get("subtotal"));
            java.math.BigDecimal tot = toBigDecimalSafe(pago.get("totalFinal"));
            java.math.BigDecimal igv = toBigDecimalSafe(pago.getOrDefault("igv", java.math.BigDecimal.ZERO));

            com.itextpdf.layout.element.Table totTable = new com.itextpdf.layout.element.Table(new float[]{4,2});
            totTable.setWidth(UnitValue.createPercentValue(50f)).setHorizontalAlignment(HorizontalAlignment.RIGHT);
            Object descDet = ((java.util.Map)pago).get("descuentoDetalle");
            if (descDet instanceof java.util.Map) {
                java.util.Map d = (java.util.Map) descDet;
                String dLabel = "Descuento" + (d.get("descripcion") != null ? (" ("+String.valueOf(d.get("descripcion"))+")") : "");
                totTable.addCell(dLabel); totTable.addCell("-" + String.valueOf(d.get("monto")));
            }
            totTable.addCell("OP. GRAVADAS"); totTable.addCell(sub.toString());
            totTable.addCell("IGV (" + empresaProperties.getIgvRate().movePointRight(2) + "%)"); totTable.addCell(igv.toString());
            totTable.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL A PAGAR").setBold()));
            totTable.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(tot.toString()).setBold()));
            Object letras = pago.getOrDefault("totalEnLetras", "");
            if (letras != null && !letras.toString().isEmpty()) {
                doc.add(new com.itextpdf.layout.element.Paragraph("Son: " + letras));
            }

            // QR
            try {
                Object qr = datos.get("pago") instanceof java.util.Map ? ((java.util.Map) datos.get("pago")).get("qrDataUri") : null;
                if (qr == null) qr = null; // ya se agregó al map principal como 'qrDataUri' en generación de datos
                Object qrMain = ((java.util.Map)datos.get("pago")).get("qrDataUri");
                if (qrMain != null && qrMain.toString().startsWith("data:image")) {
                    String base64 = qrMain.toString().substring(qrMain.toString().indexOf(",")+1);
                    byte[] bytes = java.util.Base64.getDecoder().decode(base64);
                    com.itextpdf.layout.element.Image img = new com.itextpdf.layout.element.Image(com.itextpdf.io.image.ImageDataFactory.create(bytes));
                    img.setWidth(120); img.setHeight(120);
                    doc.add(img);
                }
            } catch (Exception ignore) {}
            Object hash = ((java.util.Map)datos.get("pago")).get("hash");
            if (hash != null) doc.add(new com.itextpdf.layout.element.Paragraph("HASH: " + String.valueOf(hash)).setFontSize(9));

            doc.close();
            return os.toByteArray();
        } catch (Exception e) {
            logger.error("Error generando PDF para boleta {}: {}", idAlquiler, e.getMessage(), e);
            throw new RuntimeException("Error generando PDF de boleta (iText): " + e.getMessage(), e);
        }
    }
}