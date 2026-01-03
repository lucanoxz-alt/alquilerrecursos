package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DetalleAlquilerService {

    @Autowired private AlquilerRepository alquilerRepository;
    @Autowired private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired private RecursoRepository recursoRepository;
    @Autowired private PagoRepository pagoRepository;
    @Autowired private DetalleReservaRepository detalleReservaRepository;

    public static class FinalizarRecursoRequest {
        public String idDetalle;
        public String fechaDevolucionReal; // ISO string
        public String estadoFinal; // Disponible | Mantenimiento | Fuera de Servicio
        public String metodoPago; // opcional, para mora
    }

    public static class FinalizarRecursoResponse {
        public BigDecimal moraAplicada;
        public String boletaMora;
        public String estadoRecurso;
        public BigDecimal moraTotal; // solo cuando todos finalizados
        public java.util.List<java.util.Map<String,Object>> detallesMora; // idDetalle, idRecurso, nombreRecurso, minutosExtra, moraAplicada
    }

    public List<Map<String,Object>> listarDetallesConRecurso(String idAlquiler) {
        Alquiler a = alquilerRepository.findById(idAlquiler)
                .orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(idAlquiler);
        // Si no hay detalles (caso alquiler creado desde reserva pero no se sincronizaron detalles), reconstruir desde la reserva
        if (detalles == null || detalles.isEmpty()) {
            if (a.getIdReserva() != null) {
                List<DetalleReserva> drs = detalleReservaRepository.findByIdReserva(a.getIdReserva());
                java.util.List<DetalleAlquiler> reconstruidos = new java.util.ArrayList<>();
                for (DetalleReserva dr : drs) {
                    // Crear un detalle virtual en memoria (no persistimos) para poder mostrar en UI
                    DetalleAlquiler d = new DetalleAlquiler();
                    d.setIdDetalle("VRT-" + dr.getIdRecurso());
                    d.setIdAlquiler(idAlquiler);
                    d.setIdRecurso(dr.getIdRecurso());
                    d.setHorasRealizadas(dr.getHorasSolicitadas());
                    Recurso rec = recursoRepository.findById(dr.getIdRecurso()).orElse(null);
                    d.setCostoParcial((rec != null ? rec.getTarifaHora() : java.math.BigDecimal.ZERO)
                            .multiply(java.math.BigDecimal.valueOf(dr.getHorasSolicitadas())));
                    reconstruidos.add(d);
                }
                if (!reconstruidos.isEmpty()) {
                    detalles = reconstruidos;
                }
            }
        }
        List<Map<String,Object>> out = new ArrayList<>();
        for (DetalleAlquiler d : detalles) {
            Recurso r = recursoRepository.findById(d.getIdRecurso()).orElse(null);
            LocalDateTime horaTeoricaFin = a.getFechaHoraInicio().plusHours(d.getHorasRealizadas() != null ? d.getHorasRealizadas() : a.getDuracionHoras());
            Map<String,Object> m = new HashMap<>();
            m.put("idDetalle", d.getIdDetalle());
            m.put("idRecurso", d.getIdRecurso());
            m.put("nombreRecurso", r != null ? r.getNombre() : d.getIdRecurso());
            String estadoFisico = r != null ? r.getEstado() : null;
            String estadoLogico = d.getFechaDevolucionReal() != null ? "Devuelto" : (estadoFisico != null ? estadoFisico : "Alquilado");
            m.put("estadoRecurso", estadoFisico);
            m.put("estadoLogicoRecurso", estadoLogico);
            m.put("horaTeoricaDevolucion", horaTeoricaFin);
            m.put("fechaDevolucionReal", d.getFechaDevolucionReal());
            m.put("moraAplicada", d.getMoraAplicada());
            out.add(m);
        }
        return out;
    }

    @Transactional
    public FinalizarRecursoResponse finalizarRecurso(String idAlquiler, FinalizarRecursoRequest req) {
        if (req == null || req.idDetalle == null || req.idDetalle.isBlank()) {
            throw new RuntimeException("idDetalle requerido");
        }
        Alquiler alquiler = alquilerRepository.findById(idAlquiler)
                .orElseThrow(() -> new RuntimeException("Alquiler no encontrado: " + idAlquiler));
        DetalleAlquiler detalle = detalleAlquilerRepository.findById(req.idDetalle)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado: " + req.idDetalle));
        if (!Objects.equals(detalle.getIdAlquiler(), idAlquiler)) {
            throw new RuntimeException("El detalle no pertenece al alquiler");
        }
        Recurso recurso = recursoRepository.findById(detalle.getIdRecurso())
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado: " + detalle.getIdRecurso()));

        LocalDateTime fechaReal = parseFecha(req.fechaDevolucionReal);
        LocalDateTime horaTeoricaFin = alquiler.getFechaHoraInicio().plusHours(detalle.getHorasRealizadas() != null ? detalle.getHorasRealizadas() : alquiler.getDuracionHoras());

        long minutosExtra = Math.max(0, Duration.between(horaTeoricaFin, fechaReal).toMinutes());
        if (minutosExtra <= 5) minutosExtra = 0; else minutosExtra = minutosExtra - 5;

        BigDecimal mora = BigDecimal.ZERO;
        if (minutosExtra > 0) {
            BigDecimal tarifaHora = recurso.getTarifaHora() != null ? recurso.getTarifaHora() : BigDecimal.ZERO;
            // mora = (minutos_extra / 60.0) * tarifa_hora, redondeo hacia abajo a 2 decimales
            BigDecimal minutos = BigDecimal.valueOf(minutosExtra);
            mora = minutos.divide(BigDecimal.valueOf(60), 8, RoundingMode.HALF_UP)
                          .multiply(tarifaHora)
                          .setScale(2, RoundingMode.DOWN);
        }

        // Actualizar detalle y recurso
        detalle.setFechaDevolucionReal(fechaReal);
        detalle.setMoraAplicada(mora);
        detalleAlquilerRepository.save(detalle);

        if (req.estadoFinal != null && !req.estadoFinal.isBlank()) {
            recurso.setEstado(req.estadoFinal);
        } else {
            // Por defecto, al devolver el recurso queda disponible
            recurso.setEstado("Disponible");
        }
        recursoRepository.save(recurso);

        FinalizarRecursoResponse resp = new FinalizarRecursoResponse();
        resp.moraAplicada = mora;
        resp.estadoRecurso = recurso.getEstado();

        // Si todos los recursos del alquiler ya fueron devueltos, generar un solo pago de mora (suma)
        List<DetalleAlquiler> todos = detalleAlquilerRepository.findByIdAlquiler(idAlquiler);
        boolean todosFinalizados = todos.stream().allMatch(x -> x.getFechaDevolucionReal() != null);
        if (todosFinalizados) {
            // NO finalizar automáticamente el alquiler; la finalización debe ser manual vía endpoint específico.
            // alquilerRepository.updateEstadoAlquiler(idAlquiler, "Finalizado");

            BigDecimal totalMora = todos.stream()
                    .map(DetalleAlquiler::getMoraAplicada)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalMora.compareTo(BigDecimal.ZERO) > 0) {
                // No registrar pago automáticamente. Devolver detalle y total para que el frontend permita seleccionar método y confirmar.
                resp.boletaMora = null;
                resp.moraTotal = totalMora;
                // armar detalle por recurso con minutos extra y mora aplicada
                java.util.List<java.util.Map<String,Object>> detalleMoras = new java.util.ArrayList<>();
                for (DetalleAlquiler d : todos) {
                    if (d.getMoraAplicada() != null && d.getMoraAplicada().compareTo(BigDecimal.ZERO) > 0) {
                        java.util.Map<String,Object> m = new java.util.HashMap<>();
                        m.put("idDetalle", d.getIdDetalle());
                        m.put("idRecurso", d.getIdRecurso());
                        Recurso rDet = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                        m.put("nombreRecurso", rDet != null ? rDet.getNombre() : d.getIdRecurso());
                        // calcular minutos extra para el reporte
                        LocalDateTime hTheo = alquiler.getFechaHoraInicio().plusHours(d.getHorasRealizadas() != null ? d.getHorasRealizadas() : alquiler.getDuracionHoras());
                        long min = 0;
                        if (d.getFechaDevolucionReal() != null) {
                            min = Math.max(0, java.time.Duration.between(hTheo, d.getFechaDevolucionReal()).toMinutes());
                            if (min > 5) min = min - 5; else min = 0;
                        }
                        m.put("minutosExtra", min);
                        m.put("moraAplicada", d.getMoraAplicada());
                        detalleMoras.add(m);
                    }
                }
                resp.detallesMora = detalleMoras;
            }
        }
        return resp;
    }

    private String generarNumBoletaMora(String idAlquiler) {
        String pref = "MORA-" + idAlquiler + "-";
        long seq = pagoRepository.findAll().stream()
                .filter(p -> Objects.equals(p.getIdAlquiler(), idAlquiler))
                .filter(p -> p.getNumBoleta() != null && p.getNumBoleta().startsWith(pref))
                .count() + 1;
        return pref + String.format("%03d", seq);
    }

    private String normalizeMetodoPago(String in) {
        String v = (in == null ? "" : in).trim().toLowerCase();
        switch (v) {
            case "efectivo":
                return "Efectivo";
            case "tarjeta":
                return "Tarjeta";
            case "yape":
                return "Yape";
            case "transferencia":
            case "transfer":
            case "bank_transfer":
            case "bancaria":
                return "Transferencia";
            default:
                return "Efectivo";
        }
    }

    private LocalDateTime parseFecha(String s) {
        if (s == null || s.isBlank()) return LocalDateTime.now();
        try { return LocalDateTime.parse(s); } catch (Exception ignored) {}
        try {
            java.time.OffsetDateTime odt = java.time.OffsetDateTime.parse(s);
            return odt.atZoneSameInstant(java.time.ZoneId.systemDefault()).toLocalDateTime();
        } catch (Exception ignored) {}
        try {
            java.time.format.DateTimeFormatter f = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
            return LocalDateTime.parse(s, f);
        } catch (Exception e) {
            throw new RuntimeException("Fecha inválida: " + s);
        }
    }
}
