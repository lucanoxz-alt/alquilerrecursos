package com.turismo.alquilerrecursos.repository;

import com.turismo.alquilerrecursos.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, String> {
    
    /**
     * Buscar pago por ID de alquiler
     */
    Pago findByIdAlquiler(String idAlquiler);
    
    /**
     * Buscar pagos por turista (a través del alquiler)
     */
    @Query("SELECT p FROM Pago p JOIN Alquiler a ON p.idAlquiler = a.idAlquiler WHERE a.idTurista = :idTurista")
    List<Pago> findPagosByTurista(@Param("idTurista") String idTurista);
    
    /**
     * Buscar pagos entre fechas
     */
    @Query("SELECT p FROM Pago p WHERE p.fechaEmision BETWEEN :fechaInicio AND :fechaFin")
    List<Pago> findPagosBetweenDates(@Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);

    @Query("SELECT p FROM Pago p JOIN Alquiler a ON p.idAlquiler = a.idAlquiler WHERE a.idUsuarioGestor = :idUsuarioGestor AND p.fechaEmision BETWEEN :fechaInicio AND :fechaFin")
    List<Pago> findPagosByUsuarioGestorAndDateRange(@Param("idUsuarioGestor") String idUsuarioGestor, @Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);
}