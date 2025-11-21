package com.turismo.alquilerrecursos;

import com.turismo.alquilerrecursos.model.Recurso;
import com.turismo.alquilerrecursos.service.DisponibilidadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@SpringBootTest
@ActiveProfiles("test")
class DisponibilidadServiceTest {

    @Autowired
    private DisponibilidadService disponibilidadService;

    @Test
    void testVerificarDisponibilidadRecurso() {
        // Datos de prueba
        String idRecurso = "REC001";
        LocalDateTime fechaInicio = LocalDateTime.now().plusHours(2);
        int duracionHoras = 3;

        // Ejecutar
        boolean disponible = disponibilidadService.verificarDisponibilidadRecurso(
            idRecurso, fechaInicio, duracionHoras);

        // Verificar
        System.out.println("Recurso " + idRecurso + " disponible: " + disponible);
        
        // Obtener detalle del conflicto
        String detalle = disponibilidadService.obtenerDetalleConflicto(
            idRecurso, fechaInicio, duracionHoras);
        System.out.println("Detalle: " + detalle);
    }

    @Test
    void testObtenerRecursosDisponibles() {
        // Datos de prueba
        LocalDateTime fechaInicio = LocalDateTime.now().plusDays(1);
        int duracionHoras = 2;

        // Ejecutar
        List<Recurso> recursos = disponibilidadService.obtenerRecursosDisponibles(
            fechaInicio, duracionHoras);

        // Verificar
        System.out.println("Recursos disponibles: " + recursos.size());
        recursos.forEach(r -> 
            System.out.println("- " + r.getNombre() + " (" + r.getIdRecurso() + ")")
        );
    }

    @Test
    void testVerificarDisponibilidadMultiple() {
        // Datos de prueba
        List<String> idsRecursos = Arrays.asList("REC001", "REC002", "REC003");
        LocalDateTime fechaInicio = LocalDateTime.now().plusDays(1);
        int duracionHoras = 4;

        // Ejecutar
        boolean todosDisponibles = disponibilidadService.verificarDisponibilidadMultiple(
            idsRecursos, fechaInicio, duracionHoras);

        // Verificar
        System.out.println("Todos los recursos disponibles: " + todosDisponibles);
        
        // Verificar cada uno individualmente
        for (String idRecurso : idsRecursos) {
            String detalle = disponibilidadService.obtenerDetalleConflicto(
                idRecurso, fechaInicio, duracionHoras);
            System.out.println(idRecurso + ": " + detalle);
        }
    }
}