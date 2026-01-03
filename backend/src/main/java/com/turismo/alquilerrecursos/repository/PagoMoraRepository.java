package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.PagoMora;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PagoMoraRepository extends JpaRepository<PagoMora, String> {
    List<PagoMora> findByIdAlquiler(String idAlquiler);
}
