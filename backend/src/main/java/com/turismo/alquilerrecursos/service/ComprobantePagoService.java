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

        BigDecimal subtotal = pago.getSubtotal();
        BigDecimal total = pago.getTotalFinal();
        BigDecimal igv = total.subtract(subtotal);

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
            "gravadas", subtotal,
            "igv", igv,
            "total", total,
            "enLetras", NumeroALetrasUtil.aMonedaPeru(total)
        ));
        String qr = QrUtil.generarQrDataUri("PAGO:"+pago.getIdPago()+"|ALQ:"+pago.getIdAlquiler()+"|TOTAL:"+total, 140);
        data.put("qr", qr);
        data.put("hash", HashUtil.sha256(pago.getIdPago()+"|"+pago.getNumBoleta()));
        return data;
    }

    public String generarHTML(Map<String, Object> data) {
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
        // Para TICKET omitimos IGV (simplificado)
        html.append("<tr><td>OP. GRAVADAS</td><td class='right'>").append(resumen.get("gravadas")).append("</td></tr>");
        if (!"TICKET".equalsIgnoreCase(tipo)) {
            html.append("<tr><td>IGV (18%)</td><td class='right'>").append(resumen.get("igv")).append("</td></tr>");
        }
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
        String html = generarHTML(data);
        try (java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream()) {
            com.openhtmltopdf.pdfboxout.PdfRendererBuilder builder = new com.openhtmltopdf.pdfboxout.PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF de pago", e);
        }
    }

    public String generarXMLDesdeDatos(Map<String, Object> data) {
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
