// src/main/java/com/turismo/alquilerrecursos/dto/AuthResponse.java
package com.turismo.alquilerrecursos.dto;

public class AuthResponse {
    private String token;

    public AuthResponse(String token) {
        this.token = token;
    }

    // Getter para el token (necesario para que Spring Boot pueda serializarlo a JSON)
    public String getToken() {
        return token;
    }
}