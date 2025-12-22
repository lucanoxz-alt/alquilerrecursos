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

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class BoletaService {

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
        
        // Datos de la empresa (simulados)
        Map<String, Object> empresa = new HashMap<>();
        empresa.put("nombre", "Turismo Aventura SAC");
        empresa.put("ruc", "20123456789");
        empresa.put("direccion", "Av. La Marina 123, Chorrillos, Lima");
        empresa.put("telefono", "+51 999 888 777");
        empresa.put("email", "ventas@turismoaventura.com");
        
        // Datos del alquiler
        Map<String, Object> datosAlquiler = new HashMap<>();
        datosAlquiler.put("id", alquiler.getIdAlquiler());
        datosAlquiler.put("fechaInicio", alquiler.getFechaHoraInicio().format(formatter));
        datosAlquiler.put("duracionHoras", alquiler.getDuracionHoras());
        LocalDateTime fechaFinCalc = alquiler.getFechaHoraFin();
        if (fechaFinCalc == null && alquiler.getFechaHoraInicio() != null && alquiler.getDuracionHoras() != null) {
            fechaFinCalc = alquiler.getFechaHoraInicio().plusHours(alquiler.getDuracionHoras());
        }
        datosAlquiler.put("fechaFin", fechaFinCalc != null ? fechaFinCalc.format(formatter) : "");
        datosAlquiler.put("estado", alquiler.getEstadoalquiler());
        
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
            datosPago.put("numBoleta", pago.getNumBoleta());
            datosPago.put("fechaEmision", pago.getFechaEmision().format(formatter));
            datosPago.put("subtotal", pago.getSubtotal());
            datosPago.put("descuento", pago.getDescuentoAplicado());
            datosPago.put("totalFinal", pago.getTotalFinal());
            datosPago.put("montoPagado", pago.getMontoPagado());
            datosPago.put("metodoPago", pago.getMetodoPago());
        } else {
            datosPago.put("numBoleta", "N/D");
            datosPago.put("fechaEmision", LocalDateTime.now().format(formatter));
            datosPago.put("subtotal", alquiler.getCostoTotal());
            datosPago.put("descuento", BigDecimal.ZERO);
            datosPago.put("totalFinal", alquiler.getCostoTotal());
            datosPago.put("montoPagado", alquiler.getCostoTotal());
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
        Map<String, Object> datos = generarDatosBoleta(idAlquiler);
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang='es'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'>");
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
        
        // Header de la empresa
        Map<String, Object> empresa = (Map<String, Object>) datos.get("empresa");
        html.append("<div class='header'>");
        html.append("<h1>").append(empresa.get("nombre")).append("</h1>");
        html.append("<p>RUC: ").append(empresa.get("ruc")).append("</p>");
        html.append("<p>").append(empresa.get("direccion")).append("</p>");
        html.append("<p>Tel: ").append(empresa.get("telefono")).append(" | Email: ").append(empresa.get("email")).append("</p>");
        html.append("<h2>BOLETA DE ALQUILER</h2>");
        html.append("</div>");
        
        // Datos del alquiler y turista
        Map<String, Object> alquiler = (Map<String, Object>) datos.get("alquiler");
        Map<String, Object> turista = (Map<String, Object>) datos.get("turista");
        Map<String, Object> pago = (Map<String, Object>) datos.get("pago");
        
        html.append("<div class='section'>");
        html.append("<h3>Información del Alquiler</h3>");
        html.append("<p><strong>ID Alquiler:</strong> ").append(alquiler.get("id")).append("</p>");
        html.append("<p><strong>Fecha de Inicio:</strong> ").append(alquiler.get("fechaInicio")).append("</p>");
        html.append("<p><strong>Duración:</strong> ").append(alquiler.get("duracionHoras")).append(" horas</p>");
        html.append("<p><strong>Fecha de Fin:</strong> ").append(alquiler.get("fechaFin")).append("</p>");
        html.append("</div>");
        
        html.append("<div class='section'>");
        html.append("<h3>Datos del Cliente</h3>");
        html.append("<p><strong>Nombre:</strong> ").append(turista.get("nombres")).append(" ").append(turista.get("apellidos")).append("</p>");
        html.append("<p><strong>Documento:</strong> ").append(turista.get("documento")).append("</p>");
        html.append("<p><strong>Nacionalidad:</strong> ").append(turista.get("nacionalidad")).append("</p>");
        html.append("</div>");
        
        html.append("<div class='section'>");
        html.append("<h3>Resumen de Pago</h3>");
        html.append("<p><strong>N° Boleta:</strong> ").append(pago.get("numBoleta")).append("</p>");
        html.append("<p><strong>Método de Pago:</strong> ").append(pago.get("metodoPago")).append("</p>");
        html.append("<p><strong>Subtotal:</strong> S/. ").append(pago.get("subtotal")).append("</p>");
        html.append("<p><strong>Descuento:</strong> S/. ").append(pago.get("descuento")).append("</p>");
        html.append("<p class='total'><strong>Total Pagado:</strong> S/. ").append(pago.get("totalFinal")).append("</p>");
        html.append("</div>");
        
        html.append("<div class='section'>");
        html.append("<p><em>Boleta generada el: ").append(datos.get("fechaGeneracion")).append("</em></p>");
        html.append("<p><em>Gracias por su preferencia!</em></p>");
        html.append("</div>");
        
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }
}