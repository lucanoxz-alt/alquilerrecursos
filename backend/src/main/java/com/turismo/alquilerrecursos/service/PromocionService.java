package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Promocion;
import com.turismo.alquilerrecursos.repository.PromocionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PromocionService {

    @Autowired
    private PromocionRepository promocionRepository;

    /**
     * Obtener todas las promociones
     */
    public List<Promocion> obtenerTodasLasPromociones() {
        return promocionRepository.findAll();
    }

    /**
     * Obtener promociones activas
     */
    public List<Promocion> obtenerPromocionesActivas() {
        return promocionRepository.findByActiva(true);
    }

    /**
     * Obtener promoción por ID
     */
    public Optional<Promocion> obtenerPromocionPorId(String idPromocion) {
        return promocionRepository.findById(idPromocion);
    }

    /**
     * Crear nueva promoción
     */
    @Transactional
    public Promocion crearPromocion(Promocion promocion) {
        // Generar ID automático si no existe
        if (promocion.getIdPromocion() == null || promocion.getIdPromocion().isEmpty()) {
            String ultimoId = obtenerUltimoIdPromocion();
            if (ultimoId == null) {
                promocion.setIdPromocion("PROMO001");
            } else {
                int numero = Integer.parseInt(ultimoId.substring(5));
                numero++;
                promocion.setIdPromocion(String.format("PROMO%03d", numero));
            }
        }

        // Validar fechas
        if (promocion.getFechaInicio().isAfter(promocion.getFechaFin())) {
            throw new RuntimeException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        // Validar porcentaje de descuento
        if (promocion.getPorcentajeDesc().doubleValue() <= 0 || promocion.getPorcentajeDesc().doubleValue() > 100) {
            throw new RuntimeException("El porcentaje de descuento debe estar entre 1 y 100");
        }

        return promocionRepository.save(promocion);
    }

    /**
     * Actualizar promoción existente
     */
    @Transactional
    public Promocion actualizarPromocion(String idPromocion, Promocion promocionActualizada) {
        return promocionRepository.findById(idPromocion)
                .map(promocion -> {
                    promocion.setNombre(promocionActualizada.getNombre());
                    promocion.setDescripcion(promocionActualizada.getDescripcion());
                    promocion.setPorcentajeDesc(promocionActualizada.getPorcentajeDesc());
                    promocion.setFechaInicio(promocionActualizada.getFechaInicio());
                    promocion.setFechaFin(promocionActualizada.getFechaFin());
                    promocion.setCondicionMinima(promocionActualizada.getCondicionMinima());
                    promocion.setActiva(promocionActualizada.getActiva());
                    return promocionRepository.save(promocion);
                })
                .orElseThrow(() -> new RuntimeException("Promoción no encontrada: " + idPromocion));
    }

    /**
     * Eliminar promoción
     */
    @Transactional
    public boolean eliminarPromocion(String idPromocion) {
        if (promocionRepository.existsById(idPromocion)) {
            promocionRepository.deleteById(idPromocion);
            return true;
        }
        return false;
    }

    /**
     * Activar/Desactivar promoción
     */
    @Transactional
    public Promocion toggleEstadoPromocion(String idPromocion) {
        return promocionRepository.findById(idPromocion)
                .map(promocion -> {
                    promocion.setActiva(!promocion.getActiva());
                    return promocionRepository.save(promocion);
                })
                .orElseThrow(() -> new RuntimeException("Promoción no encontrada: " + idPromocion));
    }

    /**
     * Verificar si una promoción es válida en una fecha específica
     */
    public boolean esPromocionValida(String idPromocion, LocalDate fecha) {
        return promocionRepository.findById(idPromocion)
                .map(promocion -> 
                    promocion.getActiva() && 
                    !fecha.isBefore(promocion.getFechaInicio()) && 
                    !fecha.isAfter(promocion.getFechaFin())
                )
                .orElse(false);
    }

    /**
     * Obtener promociones válidas para una fecha específica
     */
    public List<Promocion> obtenerPromocionesValidasParaFecha(LocalDate fecha) {
        return promocionRepository.findPromocionesValidasParaFecha(fecha);
    }

    /**
     * Método auxiliar para obtener el último ID
     */
    private String obtenerUltimoIdPromocion() {
        List<Promocion> promociones = promocionRepository.findAll();
        if (promociones.isEmpty()) {
            return null;
        }
        return promociones.stream()
                .map(Promocion::getIdPromocion)
                .max(String::compareTo)
                .orElse(null);
    }
}