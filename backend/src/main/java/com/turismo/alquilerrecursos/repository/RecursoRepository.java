package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.Recurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecursoRepository extends JpaRepository<Recurso, String> {
    
    List<Recurso> findByEstado(String estado);
    
    List<Recurso> findByIdTipo(String idTipo);
    
    @Query("SELECT r FROM Recurso r WHERE " +
           "LOWER(r.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(r.descripcion) LIKE LOWER(CONCAT('%', :termino, '%'))")
    List<Recurso> buscarPorNombreOrDescripcion(@Param("termino") String termino);
}