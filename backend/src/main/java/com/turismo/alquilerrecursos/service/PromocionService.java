package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Promocion;
import com.turismo.alquilerrecursos.repository.PromocionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                // Ajuste: la columna es CHAR(7), usar prefijo de 4 letras "PROM" + 3 dígitos
                promocion.setIdPromocion("PROM001");
            } else {
                // Suponemos formato "PROM###" (7 caracteres)
                int numero;
                try {
                    numero = Integer.parseInt(ultimoId.substring(4));
                } catch (NumberFormatException ex) {
                    // Si el formato no coincide, reiniciar la secuencia con 1
                    numero = 0;
                }
                numero++;
                promocion.setIdPromocion(String.format("PROM%03d", numero));
            }
        }

        // Las fechas ya no están en el modelo, validación removida

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
                    // fechaInicio y fechaFin ya no existen en el modelo
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
     * Verificar si una promoción es válida (solo verifica que esté activa)
     */
    public boolean esPromocionValida(String idPromocion) {
        return promocionRepository.findById(idPromocion)
                .map(Promocion::getActiva)
                .orElse(false);
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