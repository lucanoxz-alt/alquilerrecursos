package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.TipoRecurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoRecursoRepository extends JpaRepository<TipoRecurso, String> {
    
    // Buscar por nombre
    Optional<TipoRecurso> findByNombre(String nombre);
    
    // Buscar por nombre que contenga (case insensitive)
    List<TipoRecurso> findByNombreContainingIgnoreCase(String nombre);
    
    // Verificar si existe un tipo con el nombre dado
    boolean existsByNombre(String nombre);
}