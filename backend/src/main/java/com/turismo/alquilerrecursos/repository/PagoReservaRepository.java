package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.PagoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PagoReservaRepository extends JpaRepository<PagoReserva, String> {
}