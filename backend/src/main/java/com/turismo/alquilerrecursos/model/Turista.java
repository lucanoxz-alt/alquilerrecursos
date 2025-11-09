// src/main/java/com/turismo/alquilerrecursos/model/Turista.java
package com.turismo.alquilerrecursos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "TURISTA")
public class Turista {

    @Id
    @Column(name = "id_turista", columnDefinition = "CHAR(6)")
    private String idTurista; // <-- El ID se generará en el servicio, no en JPA

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 100, message = "Los nombres no pueden exceder los 100 caracteres")
    @Column(name = "nombres", length = 100, nullable = false)
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 100, message = "Los apellidos no pueden exceder los 100 caracteres")
    @Column(name = "apellidos", length = 100, nullable = false)
    private String apellidos;

    @NotBlank(message = "El DNI/Pasaporte es obligatorio")
    @Pattern(regexp = "^[A-Za-z0-9]{1,20}$", message = "El DNI/Pasaporte solo puede contener letras y números")
    @Column(name = "dni_pasaporte", length = 20, nullable = false, unique = true)
    private String dniPasaporte;

    @Size(max = 50, message = "La nacionalidad no puede exceder los 50 caracteres")
    @Column(name = "nacionalidad", length = 50)
    private String nacionalidad;

    @Size(max = 20, message = "El teléfono no puede exceder los 20 caracteres")
    @Column(name = "telefono", length = 20)
    private String telefono;

    @Size(max = 255, message = "El email no puede exceder los 255 caracteres")
    @Column(name = "email", length = 255)
    private String email;

    // Constructores
    public Turista() {}

    public Turista(String nombres, String apellidos, String dniPasaporte, String nacionalidad, String telefono, String email) {
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dniPasaporte = dniPasaporte;
        this.nacionalidad = nacionalidad;
        this.telefono = telefono;
        this.email = email;
    }

    // Getters y Setters
    public String getIdTurista() { return idTurista; }
    public void setIdTurista(String idTurista) { this.idTurista = idTurista; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getDniPasaporte() { return dniPasaporte; }
    public void setDniPasaporte(String dniPasaporte) { this.dniPasaporte = dniPasaporte; }

    public String getNacionalidad() { return nacionalidad; }
    public void setNacionalidad(String nacionalidad) { this.nacionalidad = nacionalidad; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}