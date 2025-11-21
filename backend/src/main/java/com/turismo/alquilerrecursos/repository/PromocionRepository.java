package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PromocionRepository extends JpaRepository<Promocion, String> {
    
    /**
     * Buscar promociones por estado activo
     */
    List<Promocion> findByActiva(Boolean activa);
    
    /**
     * Buscar promociones válidas para una fecha específica
     */
    @Query("SELECT p FROM Promocion p WHERE p.activa = true AND :fecha BETWEEN p.fechaInicio AND p.fechaFin")
    List<Promocion> findPromocionesValidasParaFecha(@Param("fecha") LocalDate fecha);
    
    /**
     * Buscar promociones por nombre (búsqueda parcial)
     */
    @Query("SELECT p FROM Promocion p WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Promocion> findByNombreContainingIgnoreCase(@Param("nombre") String nombre);
}