// src/main/java/com/turismo/alquilerrecursos/controller/AuthController.java
package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.config.JwtUtil;
import com.turismo.alquilerrecursos.dto.LoginRequest;
import com.turismo.alquilerrecursos.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

import com.turismo.alquilerrecursos.model.Usuario;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        // Autenticar credenciales
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Cargar detalles del usuario
        UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());

        // Generar token JWT
        String jwt = jwtUtil.generateToken(userDetails);

        // Devolver SOLO el token como string
        return ResponseEntity.ok(jwt);
    }

    /**
     * Obtener información del usuario autenticado (perfil)
     */
    @Autowired
    private com.turismo.alquilerrecursos.repository.UsuarioRepository usuarioRepository;

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null) return ResponseEntity.status(401).body("No autenticado");
        Usuario u = usuarioRepository.findByUsername(username);
        if (u == null) return ResponseEntity.status(404).body("Usuario no encontrado");
        // Retornar sólo campos seguros
        return ResponseEntity.ok(java.util.Map.of(
            "idUsuario", u.getIdUsuario(),
            "username", u.getUsername(),
            "nombre", u.getNombre(),
            "apellidos", u.getApellidos(),
            "email", u.getEmail(),
            "telefono", u.getTelefono(),
            "rol", u.getRol(),
            "estadoUsuario", u.getEstadoUsuario()
        ));
    }
}