package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    @Autowired
    private AlquilerRepository alquilerRepository;
    @Autowired
    private ReservaRepository reservaRepository;
    @Autowired
    private RecursoRepository recursoRepository;
    @Autowired
    private TuristaRepository turistaRepository;
    @Autowired
    private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired
    private DetalleReservaRepository detalleReservaRepository;
    @Autowired
    private PagoReservaRepository pagoReservaRepository;
    @Autowired
    private PagoRepository pagoRepository;

    /**
     * Dashboard con métricas generales
     */
    public Map<String, Object> obtenerDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        // Métricas básicas
        long totalReservas = reservaRepository.count();
        long totalAlquileres = alquilerRepository.count();
        long totalTuristas = turistaRepository.count();
        long totalRecursos = recursoRepository.count();

        // Reservas por estado
        List<Reserva> todasReservas = reservaRepository.findAll();
        Map<String, Long> reservasPorEstado = todasReservas.stream()
            .collect(Collectors.groupingBy(Reserva::getEstadoreserva, Collectors.counting()));

        // Alquileres activos
        List<Alquiler> alquileresActivos = alquilerRepository.findByEstadoalquiler("Activo");

        // Recursos disponibles
        List<Recurso> recursosDisponibles = recursoRepository.findByEstado("Disponible");

        // Ingresos del mes actual
        BigDecimal ingresosMesActual = calcularIngresosMesActual();

        dashboard.put("totalReservas", totalReservas);
        dashboard.put("totalAlquileres", totalAlquileres);
        dashboard.put("totalTuristas", totalTuristas);
        dashboard.put("totalRecursos", totalRecursos);
        dashboard.put("reservasPorEstado", reservasPorEstado);
        dashboard.put("alquileresActivos", alquileresActivos.size());
        dashboard.put("recursosDisponibles", recursosDisponibles.size());
        dashboard.put("ingresosMesActual", ingresosMesActual);
        dashboard.put("fechaGeneracion", LocalDateTime.now());

        return dashboard;
    }

    /**
     * Historial de alquileres por turista
     */
    public Map<String, Object> obtenerHistorialTurista(String idTurista) {
        Map<String, Object> historial = new HashMap<>();

        // Información del turista
        if (idTurista == null) {
            historial.put("error", "ID de turista es null");
            return historial;
        }
        
        Turista turista = turistaRepository.findById(idTurista).orElse(null);
        if (turista == null) {
            historial.put("error", "Turista no encontrado");
            return historial;
        }

        // Alquileres del turista
        List<Alquiler> alquileres = alquilerRepository.findAll().stream()
            .filter(a -> idTurista.equals(a.getIdTurista()))
            .collect(Collectors.toList());

        // Reservas del turista
        List<Reserva> reservas = reservaRepository.findByIdTurista(idTurista);

        // Calcular estadísticas
        BigDecimal totalGastado = alquileres.stream()
            .map(Alquiler::getCostoTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Recursos más utilizados
        Map<String, Long> recursosUtilizados = new HashMap<>();
        for (Alquiler alquiler : alquileres) {
            String idAlquiler = alquiler.getIdAlquiler();
            if (idAlquiler != null) {
                List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(idAlquiler);
                for (DetalleAlquiler detalle : detalles) {
                    String idRecurso = detalle.getIdRecurso();
                    if (idRecurso != null) {
                        recursosUtilizados.put(idRecurso, recursosUtilizados.getOrDefault(idRecurso, 0L) + 1);
                    }
                }
            }
        }

        historial.put("turista", turista);
        historial.put("alquileres", alquileres);
        historial.put("reservas", reservas);
        historial.put("totalAlquileres", alquileres.size());
        historial.put("totalReservas", reservas.size());
        historial.put("totalGastado", totalGastado);
        historial.put("recursosUtilizados", recursosUtilizados);

        return historial;
    }

    /**
     * Recursos más alquilados
     */
    public Map<String, Object> obtenerRecursosMasAlquilados() {
        Map<String, Object> resultado = new HashMap<>();

        // Obtener todos los detalles de alquileres
        List<DetalleAlquiler> todosLosDetalles = detalleAlquilerRepository.findAll();

        // Contar por recurso
        Map<String, Long> conteoRecursos = todosLosDetalles.stream()
            .collect(Collectors.groupingBy(DetalleAlquiler::getIdRecurso, Collectors.counting()));

        // Ordenar por popularidad
        List<Map.Entry<String, Long>> recursosPorPopularidad = conteoRecursos.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .collect(Collectors.toList());

        // Agregar información de los recursos
        List<Map<String, Object>> recursosDetallados = new ArrayList<>();
        for (Map.Entry<String, Long> entry : recursosPorPopularidad) {
            String idRecurso = entry.getKey();
            Long cantidadAlquileres = entry.getValue();
            
            if (idRecurso != null) {
                Recurso recurso = recursoRepository.findById(idRecurso).orElse(null);
                if (recurso != null) {
                    Map<String, Object> recursoInfo = new HashMap<>();
                    recursoInfo.put("recurso", recurso);
                    recursoInfo.put("cantidadAlquileres", cantidadAlquileres);
                    recursoInfo.put("ingresoGenerado", calcularIngresosPorRecurso(idRecurso));
                    recursosDetallados.add(recursoInfo);
                }
            }
        }

        resultado.put("recursosPopulares", recursosDetallados);
        resultado.put("totalRecursos", conteoRecursos.size());
        
        return resultado;
    }

    /**
     * Tasa de cancelación con motivos
     */
    public Map<String, Object> obtenerTasaCancelacion() {
        Map<String, Object> resultado = new HashMap<>();

        List<Reserva> todasReservas = reservaRepository.findAll();
        List<Reserva> reservasCanceladas = reservaRepository.findByEstadoreserva("Cancelada");

        // Calcular tasa de cancelación
        double tasaCancelacion = todasReservas.size() > 0 ? 
            (double) reservasCanceladas.size() / todasReservas.size() * 100 : 0;

        // Agrupar motivos de cancelación
        Map<String, Long> motivosCancelacion = reservasCanceladas.stream()
            .filter(r -> r.getMotivoCancelacion() != null)
            .collect(Collectors.groupingBy(Reserva::getMotivoCancelacion, Collectors.counting()));

        resultado.put("totalReservas", todasReservas.size());
        resultado.put("reservasCanceladas", reservasCanceladas.size());
        resultado.put("tasaCancelacion", tasaCancelacion);
        resultado.put("motivosCancelacion", motivosCancelacion);

        return resultado;
    }

    /**
     * Reporte de ingresos diferenciando operaciones con/sin promociones
     */
    public Map<String, Object> obtenerReporteIngresos(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Map<String, Object> resultado = new HashMap<>();

        // Si no se proporcionan fechas, usar el mes actual
        final LocalDateTime fechaInicioFinal;
        final LocalDateTime fechaFinFinal;
        
        if (fechaInicio == null) {
            fechaInicioFinal = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        } else {
            fechaInicioFinal = fechaInicio;
        }
        if (fechaFin == null) {
            fechaFinFinal = LocalDateTime.now();
        } else {
            fechaFinFinal = fechaFin;
        }

        // Obtener alquileres en el rango
        List<Alquiler> alquileres = alquilerRepository.findAll().stream()
            .filter(a -> a.getFechaHoraInicio().isAfter(fechaInicioFinal) && a.getFechaHoraInicio().isBefore(fechaFinFinal))
            .collect(Collectors.toList());

        // Separar por promociones
        List<Alquiler> conPromocion = alquileres.stream()
            .filter(a -> a.getIdPromocion() != null)
            .collect(Collectors.toList());

        List<Alquiler> sinPromocion = alquileres.stream()
            .filter(a -> a.getIdPromocion() == null)
            .collect(Collectors.toList());

        BigDecimal ingresosConPromocion = conPromocion.stream()
            .map(Alquiler::getCostoTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ingresosSinPromocion = sinPromocion.stream()
            .map(Alquiler::getCostoTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Ingresos de reservas
        List<PagoReserva> pagosReservas = pagoReservaRepository.findAll().stream()
            .filter(p -> p.getFechaPago().isAfter(fechaInicioFinal) && p.getFechaPago().isBefore(fechaFinFinal))
            .collect(Collectors.toList());

        BigDecimal ingresosReservas = pagosReservas.stream()
            .map(PagoReserva::getMontoPago)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        resultado.put("periodo", Map.of("inicio", fechaInicioFinal, "fin", fechaFinFinal));
        resultado.put("alquileresConPromocion", conPromocion.size());
        resultado.put("alquileresSinPromocion", sinPromocion.size());
        resultado.put("ingresosConPromocion", ingresosConPromocion);
        resultado.put("ingresosSinPromocion", ingresosSinPromocion);
        resultado.put("ingresosReservas", ingresosReservas);
        resultado.put("ingresoTotal", ingresosConPromocion.add(ingresosSinPromocion).add(ingresosReservas));

        return resultado;
    }

    /**
     * ¿Quién alquiló qué recurso a un turista?
     */
    public Map<String, Object> obtenerQuienAlquiloQue(String idTurista, String idRecurso) {
        Map<String, Object> resultado = new HashMap<>();

        List<Alquiler> alquileresConsulta = alquilerRepository.findAll();

        // Filtrar por turista si se especifica
        if (idTurista != null) {
            alquileresConsulta = alquileresConsulta.stream()
                .filter(a -> idTurista.equals(a.getIdTurista()))
                .collect(Collectors.toList());
        }

        // Construir respuesta detallada
        List<Map<String, Object>> detallesAlquileres = new ArrayList<>();
        for (Alquiler alquiler : alquileresConsulta) {
            String idAlquilerConsulta = alquiler.getIdAlquiler();
            List<DetalleAlquiler> detalles = new ArrayList<>();
            if (idAlquilerConsulta != null) {
                detalles = detalleAlquilerRepository.findByIdAlquiler(idAlquilerConsulta);
            }
            
            // Filtrar por recurso si se especifica
            if (idRecurso != null) {
                detalles = detalles.stream()
                    .filter(d -> idRecurso.equals(d.getIdRecurso()))
                    .collect(Collectors.toList());
            }

            if (!detalles.isEmpty()) {
                String idTuristaAlquiler = alquiler.getIdTurista();
                Turista turista = null;
                if (idTuristaAlquiler != null) {
                    turista = turistaRepository.findById(idTuristaAlquiler).orElse(null);
                }
                
                Map<String, Object> detalleAlquiler = new HashMap<>();
                detalleAlquiler.put("alquiler", alquiler);
                detalleAlquiler.put("turista", turista);
                detalleAlquiler.put("recursos", detalles.stream().map(d -> {
                    String idRecursoDetalle = d.getIdRecurso();
                    Recurso recurso = null;
                    if (idRecursoDetalle != null) {
                        recurso = recursoRepository.findById(idRecursoDetalle).orElse(null);
                    }
                    return Map.of("detalle", d, "recurso", recurso);
                }).collect(Collectors.toList()));
                
                detallesAlquileres.add(detalleAlquiler);
            }
        }

        resultado.put("consulta", Map.of("idTurista", idTurista, "idRecurso", idRecurso));
        resultado.put("alquileres", detallesAlquileres);
        resultado.put("totalResultados", detallesAlquileres.size());

        return resultado;
    }

    /**
     * Estado actual de recursos
     */
    public Map<String, Object> obtenerEstadoRecursos() {
        Map<String, Object> resultado = new HashMap<>();

        List<Recurso> todosRecursos = recursoRepository.findAll();
        
        Map<String, Long> recursosPorEstado = todosRecursos.stream()
            .collect(Collectors.groupingBy(Recurso::getEstado, Collectors.counting()));

        List<Recurso> recursosDisponibles = recursoRepository.findByEstado("Disponible");
        List<Recurso> recursosAlquilados = recursoRepository.findByEstado("Alquilado");
        List<Recurso> recursosReservados = recursoRepository.findByEstado("Reservado");

        resultado.put("totalRecursos", todosRecursos.size());
        resultado.put("recursosPorEstado", recursosPorEstado);
        resultado.put("recursosDisponibles", recursosDisponibles);
        resultado.put("recursosAlquilados", recursosAlquilados);
        resultado.put("recursosReservados", recursosReservados);

        return resultado;
    }

    /**
     * Reservas pendientes
     */
    public Map<String, Object> obtenerReservasPendientes() {
        Map<String, Object> resultado = new HashMap<>();

        List<Reserva> reservasPendientes = reservaRepository.findByEstadoreserva("Pendiente");

        // Agregar información de turistas y recursos
        List<Map<String, Object>> reservasDetalladas = new ArrayList<>();
        for (Reserva reserva : reservasPendientes) {
            String idTurista = reserva.getIdTurista();
            String idReserva = reserva.getIdReserva();
            
            Turista turista = null;
            if (idTurista != null) {
                turista = turistaRepository.findById(idTurista).orElse(null);
            }
            
            List<DetalleReserva> detalles = new ArrayList<>();
            if (idReserva != null) {
                detalles = detalleReservaRepository.findByIdReserva(idReserva);
            }
            
            Map<String, Object> reservaInfo = new HashMap<>();
            reservaInfo.put("reserva", reserva);
            reservaInfo.put("turista", turista);
            reservaInfo.put("recursos", detalles.stream().map(d -> {
                String idRecursoDetalle = d.getIdRecurso();
                Recurso recurso = null;
                if (idRecursoDetalle != null) {
                    recurso = recursoRepository.findById(idRecursoDetalle).orElse(null);
                }
                return Map.of("detalle", d, "recurso", recurso);
            }).collect(Collectors.toList()));
            
            reservasDetalladas.add(reservaInfo);
        }

        resultado.put("reservasPendientes", reservasDetalladas);
        resultado.put("totalPendientes", reservasPendientes.size());

        return resultado;
    }

    /**
     * Caja diaria (cuadre de caja)
     */
    public Map<String, Object> obtenerCajaDiaria(java.time.LocalDate dia, String idUsuarioGestor) {
        Map<String, Object> out = new HashMap<>();
        java.time.LocalDateTime inicio = dia.atStartOfDay();
        java.time.LocalDateTime fin = dia.atTime(23,59,59);

        // Alquileres del día (pagos)
        List<Pago> pagosAlquiler = pagoRepository.findPagosBetweenDates(inicio, fin);
        if (idUsuarioGestor != null && !idUsuarioGestor.isBlank()) {
            pagosAlquiler = pagosAlquiler.stream().filter(p -> {
                String idAlq = p.getIdAlquiler();
                if (idAlq == null) return false;
                Alquiler a = alquilerRepository.findById(idAlq).orElse(null);
                return a != null && idUsuarioGestor.equals(a.getIdUsuarioGestor());
            }).toList();
        }

        Map<String, BigDecimal> totalesAlquilerPorMedio = new HashMap<>();
        BigDecimal totalEfectivoRecibido = BigDecimal.ZERO;
        BigDecimal totalVueltoEfectivo = BigDecimal.ZERO;
        List<Map<String,Object>> detalle = new ArrayList<>();

        for (Pago p : pagosAlquiler) {
            String medio = (p.getMetodoPago() == null ? "DESCONOCIDO" : p.getMetodoPago()).toUpperCase(java.util.Locale.ROOT);
            BigDecimal totalFinal = p.getTotalFinal() != null ? p.getTotalFinal() : BigDecimal.ZERO;
            BigDecimal pagado = p.getMontoPagado() != null ? p.getMontoPagado() : BigDecimal.ZERO;
            totalesAlquilerPorMedio.put(medio, totalesAlquilerPorMedio.getOrDefault(medio, BigDecimal.ZERO).add(totalFinal));

            BigDecimal vuelto = BigDecimal.ZERO;
            if ("EFECTIVO".equals(medio)) {
                totalEfectivoRecibido = totalEfectivoRecibido.add(pagado);
                if (pagado.compareTo(totalFinal) > 0) {
                    vuelto = pagado.subtract(totalFinal);
                    totalVueltoEfectivo = totalVueltoEfectivo.add(vuelto);
                }
            }

            String gestor = null;
            if (p.getIdAlquiler() != null) {
                Alquiler a = alquilerRepository.findById(p.getIdAlquiler()).orElse(null);
                gestor = a != null ? a.getIdUsuarioGestor() : null;
            }
            detalle.add(Map.of(
                "tipo", "ALQUILER",
                "id", p.getIdAlquiler(),
                "gestor", gestor,
                "metodoPago", medio,
                "total", totalFinal,
                "pagado", pagado,
                "vuelto", vuelto,
                "fechaHora", p.getFechaEmision()
            ));
        }

        // Reservas del día (pagos)
        List<PagoReserva> pagosReserva = pagoReservaRepository.findAll().stream()
                .filter(pr -> pr.getFechaPago() != null && !pr.getFechaPago().isBefore(inicio) && !pr.getFechaPago().isAfter(fin))
                .toList();
        Map<String, BigDecimal> totalesReservaPorMedio = new HashMap<>();
        for (PagoReserva pr : pagosReserva) {
            String medio = (pr.getMetodoPago() == null ? "DESCONOCIDO" : pr.getMetodoPago()).toUpperCase(java.util.Locale.ROOT);
            BigDecimal monto = pr.getMontoPago() != null ? pr.getMontoPago() : BigDecimal.ZERO;
            totalesReservaPorMedio.put(medio, totalesReservaPorMedio.getOrDefault(medio, BigDecimal.ZERO).add(monto));

            detalle.add(Map.of(
                "tipo", "RESERVA",
                "id", pr.getIdReserva(),
                "gestor", null,
                "metodoPago", medio,
                "total", monto,
                "pagado", monto,
                "vuelto", BigDecimal.ZERO,
                "fechaHora", pr.getFechaPago()
            ));
        }

        BigDecimal efectivoNeto = totalEfectivoRecibido.subtract(totalVueltoEfectivo);

        out.put("fecha", dia);
        out.put("idUsuarioGestor", idUsuarioGestor);
        out.put("totalEfectivoRecibido", totalEfectivoRecibido);
        out.put("totalVueltoEfectivo", totalVueltoEfectivo);
        out.put("efectivoNetoEnCaja", efectivoNeto);
        out.put("totalesPorMedioAlquiler", totalesAlquilerPorMedio);
        out.put("totalesPorMedioReservas", totalesReservaPorMedio);
        out.put("detalleOperaciones", detalle);
        return out;
    }

    /**
     * Ingresos por medio
     */
    public Map<String,Object> obtenerIngresosPorMedio(java.time.LocalDateTime inicio, java.time.LocalDateTime fin) {
        Map<String, Object> out = new HashMap<>();
        java.time.LocalDateTime inicioF = inicio != null ? inicio : java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
        java.time.LocalDateTime finF = fin != null ? fin : java.time.LocalDateTime.now();

        Map<String, BigDecimal> alquilerPorMedio = new HashMap<>();
        for (Pago p : pagoRepository.findPagosBetweenDates(inicioF, finF)) {
            String medio = (p.getMetodoPago() == null ? "DESCONOCIDO" : p.getMetodoPago()).toUpperCase(java.util.Locale.ROOT);
            BigDecimal total = p.getTotalFinal() != null ? p.getTotalFinal() : BigDecimal.ZERO;
            alquilerPorMedio.put(medio, alquilerPorMedio.getOrDefault(medio, BigDecimal.ZERO).add(total));
        }

        Map<String, BigDecimal> reservaPorMedio = new HashMap<>();
        for (PagoReserva pr : pagoReservaRepository.findAll().stream()
                .filter(pr -> pr.getFechaPago() != null && !pr.getFechaPago().isBefore(inicioF) && !pr.getFechaPago().isAfter(finF))
                .toList()) {
            String medio = (pr.getMetodoPago() == null ? "DESCONOCIDO" : pr.getMetodoPago()).toUpperCase(java.util.Locale.ROOT);
            BigDecimal monto = pr.getMontoPago() != null ? pr.getMontoPago() : BigDecimal.ZERO;
            reservaPorMedio.put(medio, reservaPorMedio.getOrDefault(medio, BigDecimal.ZERO).add(monto));
        }

        out.put("rango", Map.of("inicio", inicioF, "fin", finF));
        out.put("alquileresPorMedio", alquilerPorMedio);
        out.put("reservasPorMedio", reservaPorMedio);
        BigDecimal totalAlq = alquilerPorMedio.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRes = reservaPorMedio.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        out.put("total", totalAlq.add(totalRes));
        return out;
    }

    /**
     * Alquileres por usuario gestor en rango
     */
    public Map<String,Object> obtenerAlquileresPorUsuario(java.time.LocalDateTime inicio, java.time.LocalDateTime fin, String idUsuarioGestor) {
        Map<String,Object> out = new HashMap<>();
        java.time.LocalDateTime inicioF = inicio != null ? inicio : java.time.LocalDateTime.now().minusDays(7);
        java.time.LocalDateTime finF = fin != null ? fin : java.time.LocalDateTime.now();

        List<Alquiler> alquileres = alquilerRepository.findAll().stream()
                .filter(a -> a.getFechaHoraInicio() != null && !a.getFechaHoraInicio().isBefore(inicioF) && !a.getFechaHoraInicio().isAfter(finF))
                .filter(a -> idUsuarioGestor == null || idUsuarioGestor.isBlank() || idUsuarioGestor.equals(a.getIdUsuarioGestor()))
                .toList();

        List<Map<String,Object>> detalle = new ArrayList<>();
        for (Alquiler a : alquileres) {
            Pago pago = (a.getIdAlquiler() != null) ? pagoRepository.findByIdAlquiler(a.getIdAlquiler()) : null;
            String metodo = pago != null && pago.getMetodoPago() != null ? pago.getMetodoPago().toUpperCase(java.util.Locale.ROOT) : "DESCONOCIDO";
            detalle.add(Map.of(
                    "idAlquiler", a.getIdAlquiler(),
                    "gestor", a.getIdUsuarioGestor(),
                    "metodoPago", metodo,
                    "total", a.getCostoTotal(),
                    "fechaHora", a.getFechaHoraInicio(),
                    "estado", a.getEstadoalquiler()
            ));
        }
        out.put("rango", Map.of("inicio", inicioF, "fin", finF));
        out.put("idUsuarioGestor", idUsuarioGestor);
        out.put("alquileres", detalle);
        out.put("total", detalle.size());
        return out;
    }

    /**
     * Reporte financiero detallado
     */

    /**
     * Resumen diario de caja por gestor de usuario
     */
    public Map<String, Object> obtenerResumenDiarioPorUsuario(String idUsuarioGestor, java.time.LocalDate fecha) {
        Map<String, Object> resultado = new HashMap<>();

        if (idUsuarioGestor == null || idUsuarioGestor.isBlank()) {
            resultado.put("error", "idUsuarioGestor es requerido");
            return resultado;
        }

        java.time.LocalDate dia = (fecha == null) ? java.time.LocalDate.now() : fecha;
        java.time.LocalDateTime inicioDia = dia.atStartOfDay();
        java.time.LocalDateTime finDia = dia.atTime(23, 59, 59);

        List<com.turismo.alquilerrecursos.model.Pago> pagos = pagoRepository.findPagosByUsuarioGestorAndDateRange(idUsuarioGestor, inicioDia, finDia);

        java.math.BigDecimal totalMonto = java.math.BigDecimal.ZERO;
        int totalPagos = 0;
        java.util.Map<String, java.math.BigDecimal> montoPorMetodo = new java.util.HashMap<>();

        for (com.turismo.alquilerrecursos.model.Pago pago : pagos) {
            if (pago.getMontoPagado() != null) {
                totalMonto = totalMonto.add(pago.getMontoPagado());
            }
            totalPagos++;
            String metodo = pago.getMetodoPago() == null ? "Desconocido" : pago.getMetodoPago();
            java.math.BigDecimal montoAnterior = montoPorMetodo.getOrDefault(metodo, java.math.BigDecimal.ZERO);
            if (pago.getMontoPagado() != null) {
                montoPorMetodo.put(metodo, montoAnterior.add(pago.getMontoPagado()));
            } else {
                montoPorMetodo.put(metodo, montoAnterior);
            }
        }

        resultado.put("idUsuarioGestor", idUsuarioGestor);
        resultado.put("fecha", dia);
        resultado.put("totalPagos", totalPagos);
        resultado.put("totalMonto", totalMonto);
        resultado.put("montoPorMetodo", montoPorMetodo);
        resultado.put("pagos", pagos);

        return resultado;
    }

    public Map<String, Object> obtenerReporteFinanciero(String periodo) {
        Map<String, Object> resultado = new HashMap<>();

        LocalDateTime fechaInicio;
        LocalDateTime fechaFin = LocalDateTime.now();

        // Determinar periodo
        switch (periodo != null ? periodo.toLowerCase() : "mes") {
            case "semana":
                fechaInicio = fechaFin.minus(7, ChronoUnit.DAYS);
                break;
            case "año":
                fechaInicio = fechaFin.minus(1, ChronoUnit.YEARS);
                break;
            case "mes":
            default:
                fechaInicio = fechaFin.minus(1, ChronoUnit.MONTHS);
                break;
        }

        // Obtener datos financieros
        Map<String, Object> ingresos = obtenerReporteIngresos(fechaInicio, fechaFin);
        
        // Calcular métricas adicionales
        List<Alquiler> alquileresVencidos = alquilerRepository.findAll().stream()
            .filter(a -> "Activo".equals(a.getEstadoalquiler()) && 
                        a.getFechaHoraInicio().plus(a.getDuracionHoras(), ChronoUnit.HOURS).isBefore(LocalDateTime.now()))
            .collect(Collectors.toList());

        resultado.put("periodo", periodo);
        resultado.put("fechas", Map.of("inicio", fechaInicio, "fin", fechaFin));
        resultado.putAll(ingresos);
        resultado.put("alquileresVencidos", alquileresVencidos.size());
        resultado.put("fechaGeneracion", LocalDateTime.now());

        return resultado;
    }

    // Métodos auxiliares
    private BigDecimal calcularIngresosMesActual() {
        LocalDateTime inicioMes = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finMes = LocalDateTime.now();

        return alquilerRepository.findAll().stream()
            .filter(a -> a.getFechaHoraInicio().isAfter(inicioMes) && a.getFechaHoraInicio().isBefore(finMes))
            .map(Alquiler::getCostoTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularIngresosPorRecurso(String idRecurso) {
        List<DetalleAlquiler> detalles = detalleAlquilerRepository.findAll().stream()
            .filter(d -> idRecurso.equals(d.getIdRecurso()))
            .collect(Collectors.toList());

        return detalles.stream()
            .map(DetalleAlquiler::getCostoParcial)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}