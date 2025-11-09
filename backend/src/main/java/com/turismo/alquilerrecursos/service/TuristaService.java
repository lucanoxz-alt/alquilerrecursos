// src/main/java/com/turismo/alquilerrecursos/service/TuristaService.java
package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Turista;
import com.turismo.alquilerrecursos.repository.TuristaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TuristaService {

    @Autowired
    private TuristaRepository turistaRepository;

    public Turista save(Turista turista) {
        // Generar el ID automáticamente si no está presente
        if (turista.getIdTurista() == null || turista.getIdTurista().isEmpty()) {
            // Obtener el último ID de la base de datos usando el repositorio
            String ultimoId = turistaRepository.findLastId();
            if (ultimoId == null) {
                // Si no hay registros en la base de datos, empezar con TUR001
                turista.setIdTurista("TUR001");
            } else {
                // Extraer el número del último ID (por ejemplo, de "TUR005" extrae 5)
                int numero = Integer.parseInt(ultimoId.substring(3)); // "TUR" + "005" -> "005"
                numero++; // Incrementar el número: 5 -> 6
                // Formatear el nuevo ID con el prefijo "TUR" y el número con 3 dígitos: TUR006
                turista.setIdTurista(String.format("TUR%03d", numero));
            }
        }

        // Verificar si ya existe un turista con el mismo DNI/Pasaporte
        // para evitar duplicados en la base de datos
        if (turistaRepository.findByDniPasaporte(turista.getDniPasaporte()) != null) {
            throw new RuntimeException("Ya existe un cliente con este DNI/Pasaporte.");
        }

        // Guardar el turista en la base de datos con el ID generado
        return turistaRepository.save(turista);
    }

    // 👇 NUEVO: Método para buscar por nombre, apellido o DNI
    public List<Turista> buscarPorNombreODni(String query) {
        return turistaRepository.findByNombresContainingIgnoreCaseOrApellidosContainingIgnoreCaseOrDniPasaporteContainingIgnoreCase(
            query, query, query
        );
    }

}