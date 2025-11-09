package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.DetalleReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleReservaRepository extends JpaRepository<DetalleReserva, String> {
    // Puedes añadir métodos personalizados si los necesitas más adelante, por ejemplo:
    // List<DetalleReserva> findByIdReserva(String idReserva);
}