package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.config.EmpresaProperties;
import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;
import com.turismo.alquilerrecursos.util.HashUtil;
import com.turismo.alquilerrecursos.util.NumeroALetrasUtil;
import com.turismo.alquilerrecursos.util.QrUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ComprobantePagoService {

    @Autowired private PagoRepository pagoRepository;
    @Autowired private AlquilerRepository alquilerRepository;
    @Autowired private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired private TuristaRepository turistaRepository;
    @Autowired private RecursoRepository recursoRepository;
    @Autowired private EmpresaProperties empresaProperties;

    public Map<String, Object> generarDatosComprobantePagoPorPago(String idPago) {
        Pago pago = pagoRepository.findById(idPago).orElseThrow(() -> new RuntimeException("Pago no encontrado: "+idPago));
        return generarDatosComunes(pago);
    }

    public Map<String, Object> generarDatosComprobantePagoPorAlquiler(String idAlquiler) {
        Pago pago = pagoRepository.findByIdAlquiler(idAlquiler);
        if (pago == null) throw new RuntimeException("No existe pago para el alquiler: "+idAlquiler);
        return generarDatosComunes(pago);
    }

    private Map<String, Object> generarDatosComunes(Pago pago) {
        Map<String, Object> data = new HashMap<>();
        DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        Alquiler alquiler = alquilerRepository.findById(pago.getIdAlquiler()).orElseThrow();
        Turista turista = turistaRepository.findById(alquiler.getIdTurista()).orElse(null);
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(alquiler.getIdAlquiler());

        Map<String, Object> empresa = Map.of(
            "nombre", empresaProperties.getNombre(),
            "ruc", empresaProperties.getRuc(),
            "direccion", empresaProperties.getDireccion(),
            "telefono", empresaProperties.getTelefono(),
            "email", empresaProperties.getEmail()
        );

        List<Map<String, Object>> items = new ArrayList<>();
        for (DetalleAlquiler d : detalles) {
            Recurso r = recursoRepository.findById(d.getIdRecurso()).orElse(null);
            BigDecimal pUnit = r != null ? r.getTarifaHora() : BigDecimal.ZERO;
            Map<String, Object> item = new HashMap<>();
            item.put("cantidad", d.getHorasRealizadas());
            item.put("unidad", "HORA");
            item.put("descripcion", (r != null ? r.getNombre() : d.getIdRecurso()) + (r!=null && r.getDescripcion()!=null? " ("+r.getDescripcion()+")":""));
            item.put("pUnit", pUnit);
            item.put("dto", BigDecimal.ZERO);
            item.put("total", d.getCostoParcial());
            items.add(item);
        }

        BigDecimal total = pago.getTotalFinal();
        java.math.BigDecimal rate = empresaProperties.getIgvRate() != null ? empresaProperties.getIgvRate() : new java.math.BigDecimal("0.18");
        java.math.BigDecimal divisor = java.math.BigDecimal.ONE.add(rate);
        BigDecimal gravadas = total.divide(divisor, 2, java.math.RoundingMode.HALF_UP);
        BigDecimal igv = total.subtract(gravadas);

        data.put("empresa", empresa);
        data.put("cliente", Map.of(
            "nombre", turista != null ? (String.join(" ", Optional.ofNullable(turista.getNombres()).orElse(""), Optional.ofNullable(turista.getApellidos()).orElse(""))).trim() : "",
            "documento", turista != null ? turista.getDniPasaporte() : "",
            "email", turista != null ? turista.getEmail() : ""
        ));
        data.put("pago", Map.of(
            "num", pago.getNumBoleta(),
            "fecha", pago.getFechaEmision().format(df),
            "metodo", pago.getMetodoPago(),
            "idAlquiler", pago.getIdAlquiler(),
            "vendedorId", Optional.ofNullable(alquiler.getIdUsuarioGestor()).orElse("")
        ));
        data.put("items", items);
        data.put("resumen", Map.of(
            "gravadas", gravadas,
            "igv", igv,
            "total", total,
            "enLetras", NumeroALetrasUtil.aMonedaPeru(total)
        ));
        String qr = QrUtil.generarQrDataUri("PAGO:"+pago.getIdPago()+"|ALQ:"+pago.getIdAlquiler()+"|TOTAL:"+total, 140);
        data.put("qr", qr);
        data.put("hash", HashUtil.sha256(pago.getIdPago()+"|"+pago.getNumBoleta()));
        return data;
    }

        // Se soportan tipos: 'FACTURA' (por defecto) o 'TICKET'
        String tipo = data.containsKey("tipo") ? String.valueOf(data.get("tipo")) : "FACTURA";

        // Layout estilo factura electrónica con columnas y resumen
        StringBuilder css = new StringBuilder();
        css.append("body{font-family:Times New Roman,serif;margin:2.5cm;} h1,h2,h3{margin:0} .row{display:flex;justify-content:space-between} .muted{color:#555} table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ddd;padding:6px;font-size:12px} th{background:#f3f3f3} .totales{margin-top:16px;width:50%;float:right} .right{text-align:right}");

        List<Map<String,Object>> items = (List<Map<String,Object>>) data.get("items");
        Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
        Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
        Map<String,Object> pago = (Map<String,Object>) data.get("pago");
        Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");
        String qr = (String) data.get("qr");
        String hash = (String) data.get("hash");

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>Comprobante de Pago</title><style>").append(css).append("</style></head><body>");
        html.append("<div class='row'><div>");

        // Cabecera empresa; para TICKET la información fiscal se simplifica
        if ("TICKET".equalsIgnoreCase(tipo)) {
            html.append("<h2>").append(empresa.get("nombre")).append("</h2>");
            html.append("<div class='muted'>Tel: ").append(empresa.get("telefono")).append(" | ").append(empresa.get("email")).append("</div>");
        } else {
            html.append("<h2>").append(empresa.get("nombre")).append("</h2>");
            html.append("<div class='muted'>RUC ").append(empresa.get("ruc")).append("</div>");
            html.append("<div class='muted'>").append(empresa.get("direccion")).append("</div>");
            html.append("<div class='muted'>").append(empresa.get("telefono")).append(" | ").append(empresa.get("email")).append("</div>");
        }

        html.append("</div><div style='text-align:right'>");
        String numStr = pago.get("num") != null ? String.valueOf(pago.get("num")) : "";
        String headerTitle;
        if (numStr.startsWith("BOLETA-")) {
            headerTitle = "BOLETA";
        } else if ("TICKET".equalsIgnoreCase(tipo)) {
            headerTitle = "TICKET DE ALQUILER";
        } else {
            headerTitle = "FACTURA ELECTRÓNICA";
        }
        html.append("<h3>").append(headerTitle).append("</h3>");
        html.append("<div class='muted'>N° ").append(numStr).append("</div>");
        html.append("</div></div><hr/");

        html.append("><div class='row'><div>");
        html.append("<div><strong>Cliente: </strong>").append(cliente.get("nombre")).append("</div>");
        html.append("<div><strong>DNI/RUC: </strong>").append(cliente.get("documento")).append("</div>");
        html.append("<div class='muted'><strong>Email: </strong>").append(cliente.get("email")).append("</div>");
        html.append("</div><div style='text-align:right'>");
        html.append("<div><strong>Fecha emisión: </strong>").append(pago.get("fecha")).append("</div>");
        html.append("<div><strong>Orden compra: </strong>").append(pago.get("idAlquiler")).append("</div>");
        html.append("<div><strong>Forma de pago: </strong>").append(pago.get("metodo")).append("</div>");
        html.append("<div><strong>ID Vendedor: </strong>").append(pago.get("vendedorId")).append("</div>");
        html.append("</div></div>");

        html.append("<table><thead><tr>");
        html.append("<th>CANT.</th><th>UNIDAD</th><th>DESCRIPCIÓN</th><th class='right'>P. UNIT.</th><th class='right'>DTO.</th><th class='right'>TOTAL</th>");
        html.append("</tr></thead><tbody>");
        for (Map<String,Object> it : items) {
            html.append("<tr>");
            html.append("<td>").append(it.get("cantidad")).append("</td>");
            html.append("<td>").append(it.get("unidad")).append("</td>");
            html.append("<td>").append(it.get("descripcion")).append("</td>");
            html.append("<td class='right'>").append(it.get("pUnit")).append("</td>");
            html.append("<td class='right'>").append(it.get("dto")).append("</td>");
            html.append("<td class='right'>").append(it.get("total")).append("</td>");
            html.append("</tr>");
        }
        html.append("</tbody></table>");

        html.append("<div class='totales'><table>");
        html.append("<tr><td>OP. GRAVADAS</td><td class='right'>").append(resumen.get("gravadas")).append("</td></tr>");
        html.append("<tr><td>IGV (18%)</td><td class='right'>").append(resumen.get("igv")).append("</td></tr>");
        html.append("<tr><th>TOTAL A PAGAR</th><th class='right'>").append(resumen.get("total")).append("</th></tr>");
        html.append("</table>");
        html.append("<div class='muted'>Son: ").append(resumen.get("enLetras")).append("</div>");
        html.append("</div>");

        html.append("<div style='margin-top:20px' class='row'><div><img src='").append(qr).append("' width='120' height='120'/></div>");
        html.append("<div style='text-align:right'><div class='muted'>HASH: ").append(hash).append("</div></div></div>");

        html.append("</body></html>");
        return html.toString();
    }

    public byte[] generarPDFDesdeDatos(Map<String, Object> data) {
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf);

            Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
            Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
            Map<String,Object> pago = (Map<String,Object>) data.get("pago");
            Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");
            java.util.List<java.util.Map<String,Object>> items = (java.util.List<java.util.Map<String,Object>>) data.get("items");

            // Cabecera
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("nombre"))).setBold().setFontSize(14));
            doc.add(new com.itextpdf.layout.element.Paragraph("RUC " + String.valueOf(empresa.get("ruc"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("direccion"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("telefono")) + " | " + String.valueOf(empresa.get("email"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));

            String num = pago.get("num") != null ? String.valueOf(pago.get("num")) : "";
            doc.add(new com.itextpdf.layout.element.Paragraph("COMPROBANTE DE PAGO").setBold());
            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + num));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha emisión: " + String.valueOf(pago.get("fecha"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Orden compra: " + String.valueOf(pago.get("idAlquiler"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Forma de pago: " + String.valueOf(pago.get("metodo"))));

            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(new com.itextpdf.layout.element.Paragraph("Cliente: " + String.valueOf(cliente.get("nombre"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("DNI/RUC: " + String.valueOf(cliente.get("documento"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Email: " + String.valueOf(cliente.get("email"))));

            // Tabla de items
            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(new float[]{1, 2, 5, 2, 2, 2});
            table.setWidthPercent(100);
            String[] headers = {"CANT.", "UNIDAD", "DESCRIPCIÓN", "P. UNIT.", "DTO.", "TOTAL"};
            for (String h : headers) table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(h).setBold()));
            for (java.util.Map<String,Object> it : items) {
                table.addCell(String.valueOf(it.get("cantidad")));
                table.addCell(String.valueOf(it.get("unidad")));
                table.addCell(String.valueOf(it.get("descripcion")));
                table.addCell(String.valueOf(it.get("pUnit")));
                table.addCell(String.valueOf(it.get("dto")));
                table.addCell(String.valueOf(it.get("total")));
            }
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(table);

            // Totales
            com.itextpdf.layout.element.Table tot = new com.itextpdf.layout.element.Table(new float[]{4,2});
            tot.setWidthPercent(50).setHorizontalAlignment(com.itextpdf.layout.property.HorizontalAlignment.RIGHT);
            tot.addCell("OP. GRAVADAS"); tot.addCell(String.valueOf(resumen.get("gravadas")));
            tot.addCell("IGV (" + empresaProperties.getIgvRate().movePointRight(2) + "%)"); tot.addCell(String.valueOf(resumen.get("igv")));
            tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL A PAGAR").setBold()));
            tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(resumen.get("total"))).setBold()));
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(tot);
            doc.add(new com.itextpdf.layout.element.Paragraph("Son: " + String.valueOf(resumen.get("enLetras"))));

            // QR y hash si existen
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
            throw new RuntimeException("Error generando PDF de pago (iText)", e);
        }
    }

        // Genera un XML sencillo con la estructura requerida
        Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
        Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
        Map<String,Object> pago = (Map<String,Object>) data.get("pago");
        Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");
        List<Map<String,Object>> items = (List<Map<String,Object>>) data.get("items");
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<Comprobante>");
        sb.append("<Empresa>");
        sb.append("<Nombre>").append(empresa.get("nombre")).append("</Nombre>");
        sb.append("<RUC>").append(empresa.get("ruc")).append("</RUC>");
        sb.append("</Empresa>");
        sb.append("<Pago>");
        sb.append("<Numero>").append(pago.get("num")).append("</Numero>");
        sb.append("<Fecha>").append(pago.get("fecha")).append("</Fecha>");
        sb.append("<OrdenCompra>").append(pago.get("idAlquiler")).append("</OrdenCompra>");
        sb.append("<Total>").append(resumen.get("total")).append("</Total>");
        sb.append("</Pago>");
        sb.append("<Cliente>");
        sb.append("<Nombre>").append(cliente.get("nombre")).append("</Nombre>");
        sb.append("<Documento>").append(cliente.get("documento")).append("</Documento>");
        sb.append("</Cliente>");
        sb.append("<Items>");
        for (Map<String,Object> it : items) {
            sb.append("<Item>");
            sb.append("<Cantidad>").append(it.get("cantidad")).append("</Cantidad>");
            sb.append("<Unidad>").append(it.get("unidad")).append("</Unidad>");
            sb.append("<Descripcion>").append(it.get("descripcion")).append("</Descripcion>");
            sb.append("<PUnit>").append(it.get("pUnit")).append("</PUnit>");
            sb.append("<Dto>").append(it.get("dto")).append("</Dto>");
            sb.append("<Total>").append(it.get("total")).append("</Total>");
            sb.append("</Item>");
        }
        sb.append("</Items>");
        sb.append("</Comprobante>");
        return sb.toString();
    }
}
