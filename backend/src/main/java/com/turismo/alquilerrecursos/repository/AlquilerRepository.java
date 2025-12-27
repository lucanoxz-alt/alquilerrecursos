package com.turismo.alquilerrecursos.repository;
import com.turismo.alquilerrecursos.model.Alquiler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlquilerRepository extends JpaRepository<Alquiler, String> {
    @Transactional
    @Modifying
    @Query("update Alquiler a set a.estadoalquiler = :estado where a.idAlquiler = :id")
    int updateEstadoAlquiler(@Param("id") String id, @Param("estado") String estado);

    List<Alquiler> findByEstadoalquiler(String estadoalquiler);
    List<Alquiler> findByIdTurista(String idTurista);
}