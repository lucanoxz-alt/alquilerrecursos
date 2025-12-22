package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromocionRepository extends JpaRepository<Promocion, String> {
    
    /**
     * Buscar promociones por estado activo
     */
    List<Promocion> findByActiva(Boolean activa);
    
    // Método removido - fechaInicio y fechaFin ya no existen en el modelo
    
    /**
     * Buscar promociones por nombre (búsqueda parcial)
     */
    @Query("SELECT p FROM Promocion p WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Promocion> findByNombreContainingIgnoreCase(@Param("nombre") String nombre);
}