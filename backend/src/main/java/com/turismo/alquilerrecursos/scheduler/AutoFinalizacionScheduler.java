package com.turismo.alquilerrecursos.scheduler;

import com.turismo.alquilerrecursos.model.Alquiler;
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

    // Cada minuto verifica y finaliza alquileres vencidos
    @Scheduled(fixedRate = 60_000)
    public void finalizarAlquileresVencidos() {
        List<Alquiler> activos = alquilerRepository.findByEstadoalquiler("Activo");
        LocalDateTime ahora = LocalDateTime.now();
        for (Alquiler a : activos) {
            if (a.getFechaHoraFin() != null && !ahora.isBefore(a.getFechaHoraFin())) {
                // Solo actualizar el estado para evitar intentar escribir sobre columnas calculadas
                alquilerRepository.updateEstadoAlquiler(a.getIdAlquiler(), "Finalizado");
                var detalles = detalleAlquilerRepository.findByIdAlquiler(a.getIdAlquiler());
                detalles.forEach(d -> {
                    var rec = recursoRepository.findById(d.getIdRecurso()).orElse(null);
                    if (rec != null) {
                        rec.setEstado("Disponible");
                        recursoRepository.save(rec);
                    }
                });
            }
        }
    }
}
