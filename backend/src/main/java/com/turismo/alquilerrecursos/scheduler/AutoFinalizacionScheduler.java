package com.turismo.alquilerrecursos.scheduler;

import com.turismo.alquilerrecursos.model.Alquiler;
import com.turismo.alquilerrecursos.model.DetalleAlquiler;
import com.turismo.alquilerrecursos.repository.AlquilerRepository;
import com.turismo.alquilerrecursos.repository.DetalleAlquilerRepository;
import com.turismo.alquilerrecursos.repository.RecursoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AutoFinalizacionScheduler {

    @Autowired private AlquilerRepository alquilerRepository;
    @Autowired private DetalleAlquilerRepository detalleAlquilerRepository;
    @Autowired private RecursoRepository recursoRepository;

    // Cada minuto verifica recursos por detalle y libera los que hayan cumplido su tiempo.
    // Finaliza el alquiler cuando todos los detalles hayan vencido.
    @Scheduled(fixedRate = 60_000)
    public void finalizarAlquileresVencidos() {
        List<Alquiler> activos = alquilerRepository.findByEstadoalquiler("Activo");
        LocalDateTime ahora = LocalDateTime.now(java.time.ZoneId.of("America/Lima"));
        java.util.Set<String> recursosOcupados = new java.util.HashSet<>();
        for (Alquiler a : activos) {
            List<DetalleAlquiler> detalles = detalleAlquilerRepository.findByIdAlquiler(a.getIdAlquiler());
            boolean todosVencidos = true;
            for (DetalleAlquiler d : detalles) {
                LocalDateTime ini = a.getFechaHoraInicio();
                LocalDateTime finDetalle = (ini != null && d.getHorasRealizadas() != null) ? ini.plusHours(d.getHorasRealizadas()) : a.getFechaHoraFin();
                boolean vencido = (finDetalle != null) && !ahora.isBefore(finDetalle);
                if (vencido) {
                    var rec = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                    if (rec != null && !"Disponible".equalsIgnoreCase(String.valueOf(rec.getEstado()))) {
                        rec.setEstado("Disponible");
                        recursoRepository.save(rec);
                    }
                } else {
                    todosVencidos = false;
                    recursosOcupados.add(d.getIdRecurso());
                    var rec = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                    if (rec != null && !"Alquilado".equalsIgnoreCase(String.valueOf(rec.getEstado()))) {
                        rec.setEstado("Alquilado");
                        recursoRepository.save(rec);
                    }
                }
            }
            if (todosVencidos) {
                alquilerRepository.updateEstadoAlquiler(a.getIdAlquiler(), "Finalizado");
            }
        }
        // Reconciliar recursos que quedaron marcados como 'Alquilado' pero ya no tienen ocupación vigente
        recursoRepository.findAll().forEach(rec -> {
            if ("Alquilado".equalsIgnoreCase(String.valueOf(rec.getEstado())) && !recursosOcupados.contains(rec.getIdRecurso())) {
                rec.setEstado("Disponible");
                recursoRepository.save(rec);
            }
        });
    }
}
