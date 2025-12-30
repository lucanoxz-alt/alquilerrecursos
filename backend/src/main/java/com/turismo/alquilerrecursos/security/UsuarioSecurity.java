package com.turismo.alquilerrecursos.security;

import com.turismo.alquilerrecursos.model.Usuario;
import com.turismo.alquilerrecursos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("usuarioSecurity")
public class UsuarioSecurity {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public boolean isSelf(String idUsuario) {
        if (idUsuario == null) return false;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String username = auth.getName();
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario).orElse(null);
            if (usuario == null) return false;
            return username.equals(usuario.getUsername());
        } catch (Exception e) {
            return false;
        }
    }
}
