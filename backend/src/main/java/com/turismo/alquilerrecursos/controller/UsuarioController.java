package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.model.Usuario;
import com.turismo.alquilerrecursos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Usuario>> obtenerTodosUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuarioPorId(@PathVariable String id) {
        if (id == null || id.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return usuarioRepository.findById(id)
                .map(usuario -> ResponseEntity.ok().body(usuario))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody Usuario usuario) {
        try {
            if (usuario == null) {
                return ResponseEntity.badRequest().body("Usuario inválido");
            }
            if (usuario.getUsername() == null || usuario.getUsername().isEmpty()) {
                return ResponseEntity.badRequest().body("Username es requerido");
            }
            if (usuarioRepository.existsByUsername(usuario.getUsername())) {
                return ResponseEntity.badRequest().body("El username ya está en uso");
            }
            if (usuario.getEmail() != null && !usuario.getEmail().isEmpty() && usuarioRepository.existsByEmail(usuario.getEmail())) {
                return ResponseEntity.badRequest().body("El email ya está en uso");
            }

            // Generar ID si no viene: USR001...
            if (usuario.getIdUsuario() == null || usuario.getIdUsuario().isEmpty()) {
                usuario.setIdUsuario(generarSiguienteIdUsuario());
            }

            // Encriptar password
            if (usuario.getPassword() == null || usuario.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("Password es requerido");
            }
            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

            // Estado de usuario por defecto
            if (usuario.getEstadoUsuario() == null || usuario.getEstadoUsuario().isEmpty()) {
                usuario.setEstadoUsuario("Activo");
            } else {
                usuario.setEstadoUsuario(normalizarEstadoUsuario(usuario.getEstadoUsuario()));
            }

            Usuario nuevoUsuario = usuarioRepository.save(usuario);
            return ResponseEntity.ok(nuevoUsuario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear usuario: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable String id, @RequestBody Usuario usuario) {
        if (id == null || id.isEmpty() || usuario == null) {
            return ResponseEntity.badRequest().body("Datos inválidos");
        }
        return usuarioRepository.findById(id)
                .map(usuarioExistente -> {
                    if (usuario.getNombre() != null) usuarioExistente.setNombre(usuario.getNombre());
                    if (usuario.getApellidos() != null) usuarioExistente.setApellidos(usuario.getApellidos());
                    if (usuario.getEmail() != null) {
                        if (!usuario.getEmail().equals(usuarioExistente.getEmail()) && usuarioRepository.existsByEmail(usuario.getEmail())) {
                            return ResponseEntity.badRequest().body("El email ya está en uso");
                        }
                        usuarioExistente.setEmail(usuario.getEmail());
                    }
                    if (usuario.getUsername() != null) {
                        if (!usuario.getUsername().equals(usuarioExistente.getUsername()) && usuarioRepository.existsByUsername(usuario.getUsername())) {
                            return ResponseEntity.badRequest().body("El username ya está en uso");
                        }
                        usuarioExistente.setUsername(usuario.getUsername());
                    }
                    if (usuario.getPassword() != null && !usuario.getPassword().isEmpty()) {
                        usuarioExistente.setPassword(passwordEncoder.encode(usuario.getPassword()));
                    }
                    if (usuario.getRol() != null) usuarioExistente.setRol(usuario.getRol());
                    if (usuario.getEstadoUsuario() != null && !usuario.getEstadoUsuario().isEmpty()) {
                        usuarioExistente.setEstadoUsuario(normalizarEstadoUsuario(usuario.getEstadoUsuario()));
                    }
                    return ResponseEntity.ok(usuarioRepository.save(usuarioExistente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable String id) {
        if (id == null || id.isEmpty()) {
            return ResponseEntity.badRequest().body("ID inválido");
        }
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    try {
                        usuarioRepository.delete(usuario);
                        return ResponseEntity.ok().build();
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().body("No se puede eliminar el usuario: " + e.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable String id) {
        if (id == null || id.isEmpty()) return ResponseEntity.badRequest().body("ID inválido");
        return usuarioRepository.findById(id)
                .map(u -> {
                    String actual = (u.getEstadoUsuario() == null) ? "Activo" : u.getEstadoUsuario();
                    String nuevo = "Activo".equalsIgnoreCase(actual) ? "Desactivado" : "Activo";
                    u.setEstadoUsuario(nuevo);
                    return ResponseEntity.ok(usuarioRepository.save(u));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Normaliza el estado de usuario recibido (acepta variantes) a valores canónicos:
     * "Activo", "Desactivado", "Bloqueado". Si el valor es desconocido, retorna "Activo".
     */
    private String normalizarEstadoUsuario(String estado) {
        if (estado == null) return "Activo";
        String e = estado.trim().toLowerCase();
        switch (e) {
            case "activo":
                return "Activo";
            case "desactivado":
            case "inactivo":
                return "Desactivado";
            case "bloqueado":
                return "Bloqueado";
            default:
                return "Activo";
        }
    }

    private String generarSiguienteIdUsuario() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        String max = usuarios.stream()
                .map(Usuario::getIdUsuario)
                .filter(s -> s != null && s.length() >= 3)
                .max(Comparator.naturalOrder())
                .orElse(null);
        if (max == null) return "USR001";
        try {
            String pref = max.substring(0, 3);
            int num = Integer.parseInt(max.substring(3));
            num++;
            if (!pref.matches("[A-Za-z]{3}")) pref = "USR";
            return String.format("%s%03d", pref, num);
        } catch (Exception e) {
            return "USR001";
        }
    }
}