// src/main/java/com/turismo/alquilerrecursos/repository/TuristaRepository.java
package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.Turista;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Importante para @Query
import org.springframework.stereotype.Repository;

@Repository
public interface TuristaRepository extends JpaRepository<Turista, String> {
    // Método existente para buscar por DNI/Pasaporte
    Turista findByDniPasaporte(String dniPasaporte);

    // Nuevo método para obtener el último ID generado
    @Query("SELECT MAX(t.idTurista) FROM Turista t")
    String findLastId();

    // 👇 NUEVO: Método para búsqueda parcial
    List<Turista> findByNombresContainingIgnoreCaseOrApellidosContainingIgnoreCaseOrDniPasaporteContainingIgnoreCase(
        String nombres, String apellidos, String dniPasaporte
    );
  
}