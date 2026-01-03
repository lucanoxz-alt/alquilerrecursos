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
    @Autowired private PromocionRepository promocionRepository;

    public Map<String,Object> generarDatosComprobantePagoPorAlquiler(String idAlquiler) {
        Pago pago = pagoRepository.findByIdAlquiler(idAlquiler);
        if (pago == null) {
            throw new RuntimeException("No existe pago para el alquiler: " + idAlquiler);
        }
        return generarDatosComprobantePagoPorPago(pago.getIdPago());
    }

    public Map<String,Object> generarDatosComprobantePagoPorPago(String idPago) {
        Pago pago = pagoRepository.findById(idPago).orElseThrow(() -> new RuntimeException("Pago no encontrado"));
        Alquiler alquiler = alquilerRepository.findById(pago.getIdAlquiler()).orElseThrow();
        Turista turista = turistaRepository.findById(alquiler.getIdTurista()).orElse(null);
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(pago.getIdAlquiler());

        List<Map<String,Object>> items = new ArrayList<>();
        for (DetalleAlquiler d : detalles) {
            Recurso r = recursoRepository.findById(d.getIdRecurso()).orElse(null);
            items.add(Map.of(
                    "cantidad", d.getHorasRealizadas(),
                    "unidad", "HORA",
                    "descripcion", r != null ? r.getNombre() : d.getIdRecurso(),
                    "pUnit", r != null ? r.getTarifaHora() : BigDecimal.ZERO,
                    "dto", BigDecimal.ZERO,
                    "total", d.getCostoParcial()
            ));
        }

        BigDecimal total = pago.getTotalFinal();
        BigDecimal rate = empresaProperties.getIgvRate();
        BigDecimal divisor = BigDecimal.ONE.add(rate);
        BigDecimal gravadas = total.divide(divisor, 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal igv = total.subtract(gravadas);

        Map<String,Object> data = new HashMap<>();
        data.put("empresa", Map.of(
                "nombre", empresaProperties.getNombre(),
                "ruc", empresaProperties.getRuc(),
                "direccion", empresaProperties.getDireccion(),
                "telefono", empresaProperties.getTelefono(),
                "email", empresaProperties.getEmail()
        ));
        data.put("cliente", Map.of(
                "nombre", turista != null ? turista.getNombres() + " " + turista.getApellidos() : "",
                "documento", turista != null ? turista.getDniPasaporte() : ""
        ));
        Map<String,Object> pagoMap = new HashMap<>();
        pagoMap.put("num", pago.getNumBoleta());
        pagoMap.put("fecha", pago.getFechaEmision().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        pagoMap.put("metodo", pago.getMetodoPago());
        pagoMap.put("idAlquiler", pago.getIdAlquiler());
        pagoMap.put("idVendedor", alquiler.getIdUsuarioGestor());
        if (alquiler.getIdReserva() != null && !alquiler.getIdReserva().isBlank()) {
            pagoMap.put("idReserva", alquiler.getIdReserva());
        }
        if (pago.getDescuentoAplicado() != null && pago.getDescuentoAplicado().compareTo(BigDecimal.ZERO) > 0) {
            String desc = null;
            try {
                // Intentar obtener descripción de la promoción
                String idProm = alquiler.getIdPromocion();
                if (idProm != null) {
                    var prom = promocionRepository.findById(idProm).orElse(null);
                    if (prom != null) {
                        desc = (prom.getNombre() != null && !prom.getNombre().isBlank()) ? prom.getNombre() : prom.getDescripcion();
                    }
                }
            } catch (Exception ignored) {}
            Map<String,Object> dtoDesc = new HashMap<>();
            if (desc != null) dtoDesc.put("descripcion", desc);
            dtoDesc.put("monto", pago.getDescuentoAplicado());
            pagoMap.put("descuento", dtoDesc);
        }
        data.put("pago", pagoMap);
        data.put("items", items);
        data.put("resumen", Map.of(
                "gravadas", gravadas,
                "igv", igv,
                "total", total,
                "enLetras", NumeroALetrasUtil.aMonedaPeru(total)
        ));
        data.put("qr", QrUtil.generarQrDataUri(
                "PAGO:" + pago.getIdPago(), 140));
        data.put("hash", HashUtil.sha256(
                pago.getIdPago() + "|" + pago.getNumBoleta()));

        return data;
    }

    public byte[] generarTicketPDFDesdeDatos(Map<String,Object> data) {
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.kernel.geom.PageSize ticketSize = new com.itextpdf.kernel.geom.PageSize(226.8f, 1000f); // ~80mm x 1000pt para evitar saltos
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf, ticketSize);
            doc.setMargins(8, 8, 8, 8);

            Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
            Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
            Map<String,Object> pago = (Map<String,Object>) data.get("pago");
            java.util.List<java.util.Map<String,Object>> items = (java.util.List<java.util.Map<String,Object>>) data.get("items");
            Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");

            try {
                com.itextpdf.io.image.ImageData logoData = com.itextpdf.io.image.ImageDataFactory.create(getClass().getResource("/static/favicon.ico"));
                com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(logoData).scaleToFit(40, 40);
                doc.add(logo);
            } catch (Exception ignored) {}

            // Encabezado compacto con logo y datos de empresa
            com.itextpdf.layout.element.Table header = new com.itextpdf.layout.element.Table(new float[]{1,5}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
            try {
                com.itextpdf.io.image.ImageData logoData2 = com.itextpdf.io.image.ImageDataFactory.create(getClass().getResource("/static/favicon-96x96.png"));
                com.itextpdf.layout.element.Image logo2 = new com.itextpdf.layout.element.Image(logoData2).scaleToFit(65, 65);
                header.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).add(logo2));
            } catch (Exception e) { header.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)); }
            com.itextpdf.layout.element.Paragraph datosEmp2 = new com.itextpdf.layout.element.Paragraph()
                .add(new com.itextpdf.layout.element.Text(String.valueOf(empresa.get("nombre"))).setBold().setFontSize(9)).add("\n")
                .add("RUC "+String.valueOf(empresa.get("ruc"))).add("\n")
                .add(String.valueOf(empresa.get("direccion"))).add("\n")
                .add(String.valueOf(empresa.get("telefono"))+" | "+String.valueOf(empresa.get("email")));
            header.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).add(datosEmp2));
            header.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER);
            doc.add(header);
            doc.add(new com.itextpdf.layout.element.Paragraph("BOLETA DE ALQUILER ELECTRÓNICA").setBold().setFontSize(10).setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));

            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + String.valueOf(pago.get("num"))).setFontSize(9).setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));
            doc.add(new com.itextpdf.layout.element.Paragraph("Cliente: " + String.valueOf(cliente.get("nombre"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph("DNI/RUC: " + String.valueOf(cliente.get("documento"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha: " + String.valueOf(pago.get("fecha"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph("Orden: " + String.valueOf(pago.get("idAlquiler"))).setFontSize(8));
            if (pago.get("idReserva") != null) doc.add(new com.itextpdf.layout.element.Paragraph("ID Reserva: " + String.valueOf(pago.get("idReserva"))).setFontSize(8));
            if (pago.get("idVendedor") != null) doc.add(new com.itextpdf.layout.element.Paragraph("ID Vendedor: " + String.valueOf(pago.get("idVendedor"))).setFontSize(8));

            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(new float[]{1,4,2,2}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("CANT.").setBold().setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("DESCRIPCIÓN").setBold().setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("PRECIO").setBold().setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL").setBold().setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            for (Map<String,Object> it : items) {
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(it.get("cantidad"))).setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(it.get("descripcion"))).setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(it.get("pUnit"))).setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(it.get("total"))).setFontSize(8)).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
            }
            doc.add(table);

            java.math.BigDecimal gravadas = (java.math.BigDecimal) resumen.get("gravadas");
            java.math.BigDecimal igv = (java.math.BigDecimal) resumen.get("igv");
            java.math.BigDecimal total = (java.math.BigDecimal) resumen.get("total");
            com.itextpdf.layout.element.Table tot = new com.itextpdf.layout.element.Table(new float[]{3,2}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
            Object descObj2 = ((Map<String,Object>)pago).get("descuento");
            if (descObj2 instanceof Map) {
                Map<String,Object> dmap = (Map<String,Object>) descObj2;
                String dLabel = "Descuento" + (dmap.get("descripcion") != null ? (" ("+String.valueOf(dmap.get("descripcion"))+")") : "");
                tot.addCell(dLabel); tot.addCell("-" + String.valueOf(dmap.get("monto")));
            }
            tot.addCell("TOTAL GRAVADO"); tot.addCell(gravadas.toString());
            tot.addCell("I.G.V"); tot.addCell(igv.toString());
            tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL").setBold())); tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(total.toString()).setBold()));
            // Bordes y formato de totales
            for (com.itextpdf.layout.element.Cell c : tot.getChildren().toArray(new com.itextpdf.layout.element.Cell[0])) { c.setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)); }
            doc.add(tot);

            String enLetras = (String) resumen.get("enLetras");
            if (enLetras != null) doc.add(new com.itextpdf.layout.element.Paragraph("Son: " + enLetras).setFontSize(8));

            try {
                String qr = (String) data.get("qr");
                if (qr != null && qr.startsWith("data:image")) {
                    String base64 = qr.substring(qr.indexOf(",")+1);
                    byte[] bytes = java.util.Base64.getDecoder().decode(base64);
                    com.itextpdf.layout.element.Image img = new com.itextpdf.layout.element.Image(com.itextpdf.io.image.ImageDataFactory.create(bytes));
                    img.setWidth(90); img.setHeight(90); img.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
                    doc.add(img);
                }
            } catch (Exception ignored) {}
            String hash = (String) data.get("hash");
            if (hash != null) doc.add(new com.itextpdf.layout.element.Paragraph("HASH: " + hash).setFontSize(7).setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));

            doc.close();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando ticket: " + e.getMessage(), e);
        }
    }

    public byte[] generarPDFDesdeDatos(Map<String,Object> data) {
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf, com.itextpdf.kernel.geom.PageSize.A4.rotate());
            doc.setMargins(36, 36, 36, 36);

            Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
            Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
            Map<String,Object> pago = (Map<String,Object>) data.get("pago");
            List<Map<String,Object>> items = (List<Map<String,Object>>) data.get("items");
            Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");

            // Encabezado compacto con logo y datos de empresa
            com.itextpdf.layout.element.Table header = new com.itextpdf.layout.element.Table(new float[]{1,6}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
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
            // Datos de empresa ya incluidos en encabezado compacto

            // Logo
            try {
                com.itextpdf.io.image.ImageData logoData = com.itextpdf.io.image.ImageDataFactory.create(getClass().getResource("/static/favicon.ico"));
                com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(logoData).scaleToFit(60, 60);
                doc.add(logo);
            } catch (Exception ignored) {}

            doc.add(new com.itextpdf.layout.element.Paragraph("BOLETA ELECTRÓNICA").setBold());
            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + String.valueOf(pago.get("num"))));

            doc.add(new com.itextpdf.layout.element.Paragraph("Cliente: " + String.valueOf(cliente.get("nombre"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("DNI/RUC: " + String.valueOf(cliente.get("documento"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha emisión: " + String.valueOf(pago.get("fecha"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Orden de Alquiler: " + String.valueOf(pago.get("idAlquiler"))));
            if (pago.get("idReserva") != null) doc.add(new com.itextpdf.layout.element.Paragraph("ID Reserva: " + String.valueOf(pago.get("idReserva"))));
            if (pago.get("idVendedor") != null) doc.add(new com.itextpdf.layout.element.Paragraph("ID Vendedor: " + String.valueOf(pago.get("idVendedor"))));

            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(new float[]{1,2,5,2,2,2}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("CANT.").setBold()).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("HORA").setBold()).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("DESCRIPCIÓN").setBold()).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("P. UNIT.").setBold()).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("DTO.").setBold()).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL").setBold()).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)).setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY));

            for (Map<String,Object> item : items) {
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(item.get("cantidad")))).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(item.get("unidad")))).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(item.get("descripcion")))).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(item.get("pUnit")))).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(item.get("dto")))).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
                table.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(String.valueOf(item.get("total")))).setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));
            }
            BigDecimal gravadas = (BigDecimal) resumen.get("gravadas");
            BigDecimal igv = (BigDecimal) resumen.get("igv");
            BigDecimal total = (BigDecimal) resumen.get("total");

            com.itextpdf.layout.element.Table totTable = new com.itextpdf.layout.element.Table(new float[]{4,2});
            totTable.setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(50f)).setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.RIGHT);
            // Descuento (opcional)
            Object descObj = ((Map<String,Object>)pago).get("descuento");
            if (descObj instanceof Map) {
                Map<String,Object> dmap = (Map<String,Object>) descObj;
                String dLabel = "Descuento" + (dmap.get("descripcion") != null ? (" ("+String.valueOf(dmap.get("descripcion"))+")") : "");
                totTable.addCell(dLabel);
                totTable.addCell("-" + String.valueOf(dmap.get("monto")));
            }
            totTable.addCell("OP. GRAVADAS"); totTable.addCell(gravadas.toString());
            totTable.addCell("IGV (" + empresaProperties.getIgvRate().movePointRight(2) + "%)"); totTable.addCell(igv.toString());
            totTable.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL A PAGAR").setBold()));
            totTable.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(total.toString()).setBold()));
            com.itextpdf.layout.element.Table layout = new com.itextpdf.layout.element.Table(new float[]{7,3}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
            layout.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).add(table));
            layout.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).add(totTable));
            doc.add(layout);

            String enLetras = (String) resumen.get("enLetras");
            if (enLetras != null && !enLetras.isEmpty()) {
                doc.add(new com.itextpdf.layout.element.Paragraph("Son: " + enLetras));
            }

            // QR
            try {
                String qr = (String) data.get("qr");
                if (qr != null && qr.startsWith("data:image")) {
                    String base64 = qr.substring(qr.indexOf(",")+1);
                    byte[] bytes = java.util.Base64.getDecoder().decode(base64);
                    com.itextpdf.layout.element.Image img = new com.itextpdf.layout.element.Image(com.itextpdf.io.image.ImageDataFactory.create(bytes));
                    img.setWidth(120); img.setHeight(120); img.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.RIGHT);
                    doc.add(img);
                }
            } catch (Exception ignore) {}
            String hash = (String) data.get("hash");
            if (hash != null) doc.add(new com.itextpdf.layout.element.Paragraph("HASH: " + hash).setFontSize(9));

            doc.close();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF: " + e.getMessage(), e);
        }
    }

    public Map<String,Object> generarDatosComprobanteMoraPorAlquiler(String idAlquiler) {

        Pago pagoMora = pagoRepository.findAll().stream()
                .filter(p -> idAlquiler.equals(p.getIdAlquiler()))
                .filter(p -> p.getNumBoleta() != null && p.getNumBoleta().startsWith("MORA-"))
                .max(Comparator.comparing(Pago::getFechaEmision))
                .orElseThrow(() -> new RuntimeException("No existe pago de mora"));

        Alquiler alquiler = alquilerRepository.findById(idAlquiler).orElseThrow();
        Turista turista = turistaRepository.findById(alquiler.getIdTurista()).orElse(null);
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(idAlquiler);

        List<Map<String,Object>> items = new ArrayList<>();
        for (DetalleAlquiler d : detalles) {
            if (d.getMoraAplicada() != null && d.getMoraAplicada().compareTo(BigDecimal.ZERO) > 0) {
                Recurso r = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                items.add(Map.of(
                        "cantidad", 1,
                        "unidad", "SERV",
                        "descripcion", (r != null ? r.getNombre() : "Recurso") + " - Mora",
                        "pUnit", d.getMoraAplicada(),
                        "dto", BigDecimal.ZERO,
                        "total", d.getMoraAplicada()
                ));
            }
        }

        BigDecimal total = pagoMora.getTotalFinal();
        BigDecimal rate = empresaProperties.getIgvRate();
        BigDecimal divisor = BigDecimal.ONE.add(rate);
        BigDecimal gravadas = total.divide(divisor, 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal igv = total.subtract(gravadas);

        Map<String,Object> data = new HashMap<>();
        data.put("empresa", Map.of(
                "nombre", empresaProperties.getNombre(),
                "ruc", empresaProperties.getRuc(),
                "direccion", empresaProperties.getDireccion(),
                "telefono", empresaProperties.getTelefono(),
                "email", empresaProperties.getEmail()
        ));
        data.put("cliente", Map.of(
                "nombre", turista != null ? turista.getNombres() + " " + turista.getApellidos() : "",
                "documento", turista != null ? turista.getDniPasaporte() : ""
        ));
        data.put("pago", Map.of(
                "num", pagoMora.getNumBoleta(),
                "fecha", pagoMora.getFechaEmision().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                "metodo", pagoMora.getMetodoPago(),
                "idAlquiler", idAlquiler
        ));
        data.put("items", items);
        data.put("resumen", Map.of(
                "gravadas", gravadas,
                "igv", igv,
                "total", total,
                "enLetras", NumeroALetrasUtil.aMonedaPeru(total)
        ));
        data.put("qr", QrUtil.generarQrDataUri(
                "MORA:" + pagoMora.getIdPago(), 140));
        data.put("hash", HashUtil.sha256(
                pagoMora.getIdPago() + "|" + pagoMora.getNumBoleta()));

        return data;
    }
}
