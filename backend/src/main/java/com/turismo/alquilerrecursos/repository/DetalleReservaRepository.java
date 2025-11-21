package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.DetalleReserva;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleReservaRepository extends JpaRepository<DetalleReserva, String> {
    List<DetalleReserva> findByIdReserva(String idReserva);
}