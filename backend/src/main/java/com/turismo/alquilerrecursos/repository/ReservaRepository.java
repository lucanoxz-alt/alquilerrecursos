package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, String> {
    // Opcional: si quieres un método explícito por nombre de atributo (no necesario)
    Reserva findByIdReserva(String idReserva);
}