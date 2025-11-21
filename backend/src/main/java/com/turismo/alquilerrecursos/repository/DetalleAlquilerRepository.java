package com.turismo.alquilerrecursos.repository;
import com.turismo.alquilerrecursos.model.DetalleAlquiler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleAlquilerRepository extends JpaRepository<DetalleAlquiler, String> {
    List<DetalleAlquiler> findByIdAlquiler(String idAlquiler);
}