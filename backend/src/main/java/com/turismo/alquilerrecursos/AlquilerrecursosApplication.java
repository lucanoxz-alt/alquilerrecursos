package com.turismo.alquilerrecursos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = "com.turismo.alquilerrecursos.model")
public class AlquilerrecursosApplication {
    public static void main(String[] args) {
        SpringApplication.run(AlquilerrecursosApplication.class, args);
    }
}