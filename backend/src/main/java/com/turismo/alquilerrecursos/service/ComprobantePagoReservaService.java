package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.config.EmpresaProperties;
import com.turismo.alquilerrecursos.model.PagoReserva;
import com.turismo.alquilerrecursos.model.Reserva;
import com.turismo.alquilerrecursos.repository.PagoReservaRepository;
import com.turismo.alquilerrecursos.repository.ReservaRepository;
import com.turismo.alquilerrecursos.repository.DetalleReservaRepository;
import com.turismo.alquilerrecursos.repository.TuristaRepository;
import com.turismo.alquilerrecursos.repository.UsuarioRepository;
import com.turismo.alquilerrecursos.repository.RecursoRepository;
import com.turismo.alquilerrecursos.util.HashUtil;
import com.turismo.alquilerrecursos.util.NumeroALetrasUtil;
import com.turismo.alquilerrecursos.util.QrUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.UnitValue;

@Service
public class ComprobantePagoReservaService {

    @Autowired private PagoReservaRepository pagoReservaRepository;
    @Autowired private ReservaRepository reservaRepository;
    @Autowired private DetalleReservaRepository detalleReservaRepository;
    @Autowired private TuristaRepository turistaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RecursoRepository recursoRepository;
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
        BigDecimal rate = empresaProperties.getIgvRate();
        BigDecimal divisor = BigDecimal.ONE.add(rate);
        BigDecimal gravadas = total.divide(divisor, 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal igv = total.subtract(gravadas);

        Map<String,Object> data = new HashMap<>();
        data.put("empresa", empresa);

        // Cliente
        com.turismo.alquilerrecursos.model.Turista tur = (r != null && r.getIdTurista()!=null) ? turistaRepository.findById(r.getIdTurista()).orElse(null) : null;
        data.put("cliente", Map.of(
                "nombre", tur != null ? (tur.getNombres()+" "+tur.getApellidos()).trim() : "",
                "documento", tur != null ? tur.getDniPasaporte() : ""
        ));

        // Usuario gestor
        String vendedor = "";
        if (r != null && r.getIdUsuarioGestor()!=null) {
            var usr = usuarioRepository.findById(r.getIdUsuarioGestor()).orElse(null);
            if (usr != null) vendedor = (usr.getNombre()+" "+usr.getApellidos()).trim();
        }

        data.put("reserva", Map.of(
                "idReserva", r != null ? r.getIdReserva() : pr.getIdReserva(),
                "fechaInicioPrevista", r != null && r.getFechaHoraInicioPrevista()!=null ? r.getFechaHoraInicioPrevista().format(df) : "",
                "idVendedor", vendedor,
                "costoTotalEstimado", r != null ? r.getCostoTotalEstimado() : null
        ));

        // Pago
        data.put("pago", Map.of(
                "num", pr.getNumComprobante(),
                "fecha", pr.getFechaPago().format(df),
                "metodo", pr.getMetodoPago(),
                "idReserva", pr.getIdReserva(),
                "montoPago", pr.getMontoPago()
        ));

        // Detalles de la reserva
        java.util.List<com.turismo.alquilerrecursos.model.DetalleReserva> dets = detalleReservaRepository.findByIdReserva(pr.getIdReserva());
        java.util.List<java.util.Map<String,Object>> items = new java.util.ArrayList<>();
        for (var d : dets) {
            var rec = recursoRepository.findById(d.getIdRecurso()).orElse(null);
            java.math.BigDecimal pUnit = rec != null ? rec.getTarifaHora() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal totalItem = pUnit.multiply(java.math.BigDecimal.valueOf(d.getHorasSolicitadas()));
            String desc = (rec != null ? rec.getNombre() : d.getIdRecurso()) + (rec != null && rec.getDescripcion()!=null? " ("+rec.getDescripcion()+")":"");
            items.add(Map.of(
                    "cantidad", d.getHorasSolicitadas(),
                    "unidad", "HORA",
                    "descripcion", desc,
                    "pUnit", pUnit,
                    "total", totalItem
            ));
        }
        data.put("items", items);

        // Resumen
        data.put("resumen", Map.of(
                "gravadas", gravadas,
                "igv", igv,
                "total", total,
                "enLetras", NumeroALetrasUtil.aMonedaPeru(total)
        ));

        data.put("qr", QrUtil.generarQrDataUri("PAGO_RESERVA:" + pr.getIdPagoReserva(), 140));
        data.put("hash", HashUtil.sha256(pr.getIdPagoReserva() + "|" + pr.getNumComprobante()));

        return data;
    }

    public Map<String,Object> generarDatosPorReserva(String idReserva) {
        List<PagoReserva> pagos = pagoReservaRepository.findByIdReserva(idReserva);
        if (pagos == null || pagos.isEmpty()) {
            throw new RuntimeException("No hay pagos para la reserva: " + idReserva);
        }
        return datosDesdePagoReserva(pagos.get(0));
    }

    public Map<String,Object> generarDatosPorPagoReserva(String idPagoReserva) {
        PagoReserva pr = pagoReservaRepository.findById(idPagoReserva)
                .orElseThrow(() -> new RuntimeException("PagoReserva no encontrado"));
        return datosDesdePagoReserva(pr);
    }

    public byte[] generarPDF(Map<String,Object> data) {
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf);

            Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
            Map<String,Object> reserva = (Map<String,Object>) data.get("reserva");
            Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
            java.util.List<java.util.Map<String,Object>> items = (java.util.List<java.util.Map<String,Object>>) data.get("items");
            Map<String,Object> pago = (Map<String,Object>) data.get("pago");
            Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");

            // Logo
            try {
                com.itextpdf.io.image.ImageData logoData = com.itextpdf.io.image.ImageDataFactory.create(getClass().getResource("/static/favicon.ico"));
                com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(logoData).scaleToFit(60, 60);
                doc.add(logo);
            } catch (Exception ignored) {}
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("nombre"))).setBold().setFontSize(14));
            doc.add(new com.itextpdf.layout.element.Paragraph("RUC " + String.valueOf(empresa.get("ruc"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("direccion"))));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("telefono")) + " | " + String.valueOf(empresa.get("email"))));

            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(new com.itextpdf.layout.element.Paragraph("BOLETA DE RESERVA ELECTRÓNICA").setBold());
            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + String.valueOf(pago.get("num"))));

            doc.add(new com.itextpdf.layout.element.Paragraph("ID Reserva: " + String.valueOf(pago.get("idReserva"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Cliente: " + String.valueOf(cliente.get("nombre"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("DNI/RUC: " + String.valueOf(cliente.get("documento"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha/Hora Empresa: " + String.valueOf(reserva.get("fechaInicioPrevista"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("ID Vendedor: " + String.valueOf(reserva.get("idVendedor"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Método de pago: " + String.valueOf(pago.get("metodo"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha emisión: " + String.valueOf(pago.get("fecha"))));
            doc.add(new com.itextpdf.layout.element.Paragraph("Método de pago: " + String.valueOf(pago.get("metodo"))));

            // Tabla de detalles
            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(new float[]{1,2,5,2,2}).setWidth(UnitValue.createPercentValue(100f));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("CANT.").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("HORA").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("DESCRIPCIÓN").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("P. UNIT.").setBold()));
            table.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL").setBold()));
            for (var it : items) {
                table.addCell(String.valueOf(it.get("cantidad")));
                table.addCell("HORA");
                table.addCell(String.valueOf(it.get("descripcion")));
                table.addCell(String.valueOf(it.get("pUnit")));
                table.addCell(String.valueOf(it.get("total")));
            }
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(table);

            BigDecimal gravadas = (BigDecimal) resumen.get("gravadas");
            BigDecimal igv = (BigDecimal) resumen.get("igv");
            BigDecimal total = (BigDecimal) resumen.get("total");

            com.itextpdf.layout.element.Table totTable = new com.itextpdf.layout.element.Table(new float[]{4,2});
            totTable.setWidth(UnitValue.createPercentValue(50f)).setHorizontalAlignment(HorizontalAlignment.RIGHT);
            totTable.addCell("OP. GRAVADAS"); totTable.addCell(gravadas.toString());
            totTable.addCell("IGV (" + empresaProperties.getIgvRate().movePointRight(2) + "%)"); totTable.addCell(igv.toString());
            totTable.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL A PAGAR").setBold()));
            totTable.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(total.toString()).setBold()));
            doc.add(new com.itextpdf.layout.element.Paragraph(" "));
            doc.add(totTable);

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
                    img.setWidth(120); img.setHeight(120);
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

    public byte[] generarTicketPDF(Map<String,Object> data) {
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(os);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf, com.itextpdf.kernel.geom.PageSize.A7);

            Map<String,Object> empresa = (Map<String,Object>) data.get("empresa");
            Map<String,Object> cliente = (Map<String,Object>) data.get("cliente");
            Map<String,Object> pago = (Map<String,Object>) data.get("pago");
            Map<String,Object> reserva = (Map<String,Object>) data.get("reserva");
            Map<String,Object> resumen = (Map<String,Object>) data.get("resumen");

            try {
                com.itextpdf.io.image.ImageData logoData = com.itextpdf.io.image.ImageDataFactory.create(getClass().getResource("/static/favicon.ico"));
                com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(logoData).scaleToFit(40, 40);
                doc.add(logo);
            } catch (Exception ignored) {}

            doc.add(new com.itextpdf.layout.element.Paragraph("BOLETA DE RESERVA ELECTRÓNICA").setBold().setFontSize(9));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("nombre")) + " | RUC " + String.valueOf(empresa.get("ruc"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("direccion"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph(String.valueOf(empresa.get("telefono")) + " | " + String.valueOf(empresa.get("email"))).setFontSize(8));

            doc.add(new com.itextpdf.layout.element.Paragraph("N° " + String.valueOf(pago.get("num"))).setFontSize(9));
            doc.add(new com.itextpdf.layout.element.Paragraph("Cliente: " + String.valueOf(cliente.get("nombre"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph("DNI/RUC: " + String.valueOf(cliente.get("documento"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph("Fecha: " + String.valueOf(pago.get("fecha"))).setFontSize(8));
            doc.add(new com.itextpdf.layout.element.Paragraph("ID Reserva: " + String.valueOf(pago.get("idReserva"))).setFontSize(8));

            java.math.BigDecimal gravadas = (java.math.BigDecimal) resumen.get("gravadas");
            java.math.BigDecimal igv = (java.math.BigDecimal) resumen.get("igv");
            java.math.BigDecimal total = (java.math.BigDecimal) resumen.get("total");
            com.itextpdf.layout.element.Table tot = new com.itextpdf.layout.element.Table(new float[]{3,2}).setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));
            tot.addCell("TOTAL GRAVADO"); tot.addCell(gravadas.toString());
            tot.addCell("I.G.V"); tot.addCell(igv.toString());
            tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph("TOTAL").setBold())); tot.addCell(new com.itextpdf.layout.element.Cell().add(new com.itextpdf.layout.element.Paragraph(total.toString()).setBold()));
            doc.add(tot);

            String enLetras = (String) resumen.get("enLetras");
            if (enLetras != null) doc.add(new com.itextpdf.layout.element.Paragraph("Son: " + enLetras).setFontSize(8));

            try {
                String qr = (String) data.get("qr");
                if (qr != null && qr.startsWith("data:image")) {
                    String base64 = qr.substring(qr.indexOf(",")+1);
                    byte[] bytes = java.util.Base64.getDecoder().decode(base64);
                    com.itextpdf.layout.element.Image img = new com.itextpdf.layout.element.Image(com.itextpdf.io.image.ImageDataFactory.create(bytes));
                    img.setWidth(90); img.setHeight(90);
                    doc.add(img);
                }
            } catch (Exception ignored) {}
            String hash = (String) data.get("hash");
            if (hash != null) doc.add(new com.itextpdf.layout.element.Paragraph("HASH: " + hash).setFontSize(7));

            doc.close();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando ticket reserva: " + e.getMessage(), e);
        }
    }
}
