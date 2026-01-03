package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.config.EmpresaProperties;
import com.turismo.alquilerrecursos.model.PagoReserva;
import com.turismo.alquilerrecursos.model.Reserva;
import com.turismo.alquilerrecursos.repository.PagoReservaRepository;
import com.turismo.alquilerrecursos.repository.ReservaRepository;
import com.turismo.alquilerrecursos.util.HashUtil;
import com.turismo.alquilerrecursos.util.NumeroALetrasUtil;
import com.turismo.alquilerrecursos.util.QrUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ComprobantePagoReservaService {
    @Autowired private PagoReservaRepository pagoReservaRepository;
    @Autowired private ReservaRepository reservaRepository;
    @Autowired private EmpresaProperties empresaProperties;

    private Map<String,Object> datosDesdePagoReserva(PagoReserva pr) {
        Reserva r = reservaRepository.findById(pr.getIdReserva()).orElse(null);
        Map<String,Object> empresa = Map.of(
            "nombre", empresaProperties.getNombre(),
            "ruc", empresaProperties.getRuc(),
            "direccion", empresaProperties.getDireccion(),
            "telefono", empresaProperties.getTelefono(),
            "email", empresaProperties.getEmail()
        );
        DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
        BigDecimal total = pr.getMontoPago();
        java.math.BigDecimal rate = empresaProperties.getIgvRate() != null ? empresaProperties.getIgvRate() : new java.math.BigDecimal("0.18");
        java.math.BigDecimal divisor = java.math.BigDecimal.ONE.add(rate);
        BigDecimal gravadas = total.divide(divisor, 2, java.math.RoundingMode.HALF_UP);
        BigDecimal igv = total.subtract(gravadas);
        Map<String,Object> data = new HashMap<>();
        data.put("empresa", empresa);
        data.put("reserva", r);
        data.put("pago", Map.of(
            "num", pr.getNumComprobante(),
            "fecha", pr.getFechaPago().format(df),
            "metodo", pr.getMetodoPago(),
            "idReserva", pr.getIdReserva()
        ));
        data.put("resumen", Map.of(
            "gravadas", gravadas,
            "igv", igv,
            "total", total,
            "enLetras", NumeroALetrasUtil.aMonedaPeru(total)
        ));
        data.put("qr", QrUtil.generarQrDataUri("PAGO_RESERVA:"+pr.getIdPagoReserva()+"|RES:"+pr.getIdReserva()+"|TOTAL:"+total, 140));
        data.put("hash", HashUtil.sha256(pr.getIdPagoReserva()+"|"+pr.getNumComprobante()));
        return data;
    }

    public Map<String,Object> generarDatosPorReserva(String idReserva) {
        List<PagoReserva> pagos = pagoReservaRepository.findByIdReserva(idReserva);
        if (pagos==null || pagos.isEmpty()) throw new RuntimeException("No hay pagos para la reserva: "+idReserva);
        // usar el primer pago (ej. 50%)
        return datosDesdePagoReserva(pagos.get(0));
    }

    public Map<String,Object> generarDatosPorPagoReserva(String idPagoReserva) {
        PagoReserva pr = pagoReservaRepository.findById(idPagoReserva).orElseThrow(() -> new RuntimeException("PagoReserva no encontrado: "+idPagoReserva));
        return datosDesdePagoReserva(pr);
    }

        Map empresa = (Map) data.get("empresa");
        Map pago = (Map) data.get("pago");
        Reserva r = (Reserva) data.get("reserva");
        Map resumen = (Map) data.get("resumen");
        String qr = (String) data.get("qr");
        String hash = (String) data.get("hash");
        StringBuilder css = new StringBuilder();
        css.append("body{font-family:Times New Roman,serif;margin:2.5cm;} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;font-size:12px} th{background:#f3f3f3} .row{display:flex;justify-content:space-between}");
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>Comprobante de Pago Reserva</title><style>").append(css).append("</style></head><body>");
        html.append("<div class='row'><div>");
        html.append("<h2>").append(empresa.get("nombre")).append("</h2>");
        html.append("<div>RUC ").append(empresa.get("ruc")).append("</div>");
        html.append("<div>").append(empresa.get("direccion")).append("</div>");
        html.append("</div><div style='text-align:right'><h3>COMPROBANTE DE PAGO RESERVA</h3><div>N° ").append(pago.get("num")).append("</div></div></div><hr/>");
        html.append("<div class='row'><div>");
        html.append("<div><strong>Reserva:</strong> ").append(pago.get("idReserva")).append("</div>");
        html.append("<div><strong>Fecha emisión:</strong> ").append(pago.get("fecha")).append("</div>");
        html.append("<div><strong>Método:</strong> ").append(pago.get("metodo")).append("</div>");
        html.append("</div></div>");
        html.append("<table style='margin-top:12px'><tbody>");
        html.append("<tr><td>Operación gravada</td><td style='text-align:right'>").append(resumen.get("gravadas")).append("</td></tr>");
        html.append("<tr><td>IGV (18%)</td><td style='text-align:right'>").append(resumen.get("igv")).append("</td></tr>");
        html.append("<tr><th>Total a pagar</th><th style='text-align:right'>").append(resumen.get("total")).append("</th></tr>");
        html.append("</tbody></table>");
        html.append("<div style='margin-top:12px'>Son: ").append(resumen.get("enLetras")).append("</div>");
        html.append("<div class='row' style='margin-top:20px'><div><img src='").append(qr).append("' width='120' height='120'/></div><div style='text-align:right'><div>HASH: ").append(hash).append("</div></div></div>");
        html.append("</body></html>");
        return html.toString();
    }

    public byte[] generarPDF(Map<String,Object> data) {
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf);

            Map empresa = (Map) data.get("empresa");
            Map pago = (Map) data.get("pago");
            Map resumen = (Map) data.get("resumen");

            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("nombre"))).setBold().setFontSize(14));
            doc.add(new com.itextpdf.layout.element.Paragraph("RUC " + String.valueOf(empresa.get("ruc"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("direccion"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(new com.itextpdf.layout.element.Paragraph("COMPROBANTE DE PAGO RESERVA").setBold());
            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + String.valueOf(pago.get("num"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Reserva: " + String.valueOf(pago.get("idReserva"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha emisión: " + String.valueOf(pago.get("fecha"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Método: " + String.valueOf(pago.get("metodo"))));

            com.itextpdf.layout.element.Table tot = new com.itextpdf.layout.element.Table(new float[]{4,2});
            tot.setWidthPercent(60).setHorizontalAlignment(com.itextpdf.layout.property.HorizontalAlignment.RIGHT);
            tot.addCell("Operación gravada"); tot.addCell(String.valueOf(resumen.get("gravadas")));
            tot.addCell("IGV (" + empresaProperties.getIgvRate().movePointRight(2) + "%)"); tot.addCell(String.valueOf(resumen.get("igv")));
            tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("Total a pagar").setBold()));
            tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(resumen.get("total"))).setBold()));
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(tot);
            doc.add(new com.itextpdf.layout.element.Paragraph("Son: " + String.valueOf(resumen.get("enLetras"))));

            try {
                String qrDataUri = (String) data.get("qr");
                if (qrDataUri != null && qrDataUri.startsWith("data:image")) {
                    String base64 = qrDataUri.substring(qrDataUri.indexOf(",")+1);
                    byte[] bytes = java.util.Base64.getDecoder().decode(base64);
                    com.itextpdf.layout.element.Image img = new com.itextpdf.layout.element.Image(com.itextpdf.io.image.ImageDataFactory.create(bytes));
                    img.setWidth(120); img.setHeight(120);
                    doc.add(img);
                }
            } catch (Exception ignore) {}
            if (data.get("hash") != null) doc.add(new com.itextpdf.layout.element.Paragraph("HASH: " + String.valueOf(data.get("hash"))).setFontSize(9));

            doc.close();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF de pago reserva (iText)", e);
        }
    }
}
