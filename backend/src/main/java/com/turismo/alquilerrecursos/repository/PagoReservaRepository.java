package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.PagoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PagoReservaRepository extends JpaRepository<PagoReserva, String> {
    
    /**
     * Buscar pagos de reserva por ID de reserva
     */
    List<PagoReserva> findByIdReserva(String idReserva);

    /**
     * Pagos de reserva entre fechas
     */
    java.util.List<PagoReserva> findByFechaPagoBetween(java.time.LocalDateTime inicio, java.time.LocalDateTime fin);
}