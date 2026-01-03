package com.turismo.alquilerrecursos.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class ComprobanteElectronicoService {

    private static final com.itextpdf.io.font.constants.StandardFonts STD_FONT = null; // placeholder to ensure iText on classpath

    @Autowired private ComprobantePagoService comprobantePagoService;
    @Autowired private ComprobantePagoReservaService comprobantePagoReservaService;

    public byte[] generarTicketPdfPorPago(String idPago, String tipo) {
        // Fase 1: delegar a generador PDF existente (HTML->PDF) hasta migrar a iText
        Map<String,Object> data = comprobantePagoService.generarDatosComprobantePagoPorPago(idPago);
        return comprobantePagoService.generarPDFDesdeDatos(data);
    }

    public byte[] generarPdfEstandarPorPago(String idPago, String tipo) {
        Map<String,Object> data = comprobantePagoService.generarDatosComprobantePagoPorPago(idPago);
        return comprobantePagoService.generarPDFDesdeDatos(data);
    }

        Map<String,Object> data = comprobantePagoService.generarDatosComprobantePagoPorPago(idPago);
        String xml = generarUblInvoiceXml(data, tipo, false);
        return persistAndReturn(xml, tipo, (Map<String,Object>) data.get("pago"));
    }

    public byte[] generarTicketPdfPorPagoReserva(String idPagoReserva, String tipo) {
        Map<String,Object> data = comprobantePagoReservaService.generarDatosPorPagoReserva(idPagoReserva);
        return comprobantePagoReservaService.generarPDF(data);
    }

    public byte[] generarPdfEstandarPorPagoReserva(String idPagoReserva, String tipo) {
        Map<String,Object> data = comprobantePagoReservaService.generarDatosPorPagoReserva(idPagoReserva);
        return comprobantePagoReservaService.generarPDF(data);
    }

        Map<String,Object> data = comprobantePagoReservaService.generarDatosPorPagoReserva(idPagoReserva);
        String xml = generarUblInvoiceXml(data, tipo, true);
        return persistAndReturn(xml, tipo, (Map<String,Object>) data.get("pago"));
    }

    // --- Métodos auxiliares mínimos para compilar ---
    @SuppressWarnings({"rawtypes","unchecked"})
        Map empresa = (Map) data.get("empresa");
        Map pago = (Map) data.get("pago");
        Map resumen = (Map) data.get("resumen");
        String serieNumero = String.valueOf(pago != null ? pago.get("num") : "");
        String total = String.valueOf(resumen != null ? resumen.getOrDefault("total", "0") : "0");
        String igv = String.valueOf(resumen != null ? resumen.getOrDefault("igv", "0") : "0");
        String gravadas = String.valueOf(resumen != null ? resumen.getOrDefault("gravadas", total) : total);
        String ruc = String.valueOf(empresa != null ? empresa.get("ruc") : "");
        String nombre = String.valueOf(empresa != null ? empresa.get("nombre") : "");
        String direccion = String.valueOf(empresa != null ? empresa.get("direccion") : "");

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\" ")
          .append("xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\" ")
          .append("xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\">");
        sb.append("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>");
        sb.append("<cbc:CustomizationID>2.0</cbc:CustomizationID>");
        sb.append("<cbc:ID>").append(escape(serieNumero)).append("</cbc:ID>");
        sb.append("<cbc:IssueDate>").append(java.time.LocalDate.now()).append("</cbc:IssueDate>");
        sb.append("<cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>");
        sb.append("<cac:AccountingSupplierParty><cac:Party>");
        sb.append("<cac:PartyIdentification><cbc:ID>").append(escape(ruc)).append("</cbc:ID></cac:PartyIdentification>");
        sb.append("<cac:PartyName><cbc:Name>").append(escape(nombre)).append("</cbc:Name></cac:PartyName>");
        sb.append("<cac:PostalAddress><cbc:StreetName>").append(escape(direccion)).append("</cbc:StreetName></cac:PostalAddress>");
        sb.append("</cac:Party></cac:AccountingSupplierParty>");
        sb.append("<cac:TaxTotal><cbc:TaxAmount currencyID=\"PEN\">").append(escape(igv)).append("</cbc:TaxAmount></cac:TaxTotal>");
        sb.append("<cac:LegalMonetaryTotal>");
        sb.append("<cbc:LineExtensionAmount currencyID=\"PEN\">").append(escape(gravadas)).append("</cbc:LineExtensionAmount>");
        sb.append("<cbc:PayableAmount currencyID=\"PEN\">").append(escape(total)).append("</cbc:PayableAmount>");
        sb.append("</cac:LegalMonetaryTotal>");
        sb.append("</Invoice>");
        return sb.toString();
    }

        try {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.nio.file.Path base = java.nio.file.Paths.get("docs","comprobantes",
                    String.valueOf(now.getYear()), String.format("%02d", now.getMonthValue()));
            java.nio.file.Files.createDirectories(base);
            String serieNum = pago != null ? String.valueOf(pago.get("num")) : "";
            String nombre = ("XML_" + (tipo!=null?tipo.toUpperCase():"BOLETA") + (serieNum!=null? ("_"+serieNum):"") + ".xml").replaceAll("[^A-Za-z0-9_.-]","_");
            java.nio.file.Path path = base.resolve(nombre);
            java.nio.file.Files.writeString(path, xml, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception ignored) {}
        return xml.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;").replace("'","&apos;");
    }
}
