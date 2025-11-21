package com.turismo.alquilerrecursos.repository;
import com.turismo.alquilerrecursos.model.Alquiler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlquilerRepository extends JpaRepository<Alquiler, String> {
    List<Alquiler> findByEstadoalquiler(String estadoalquiler);
}