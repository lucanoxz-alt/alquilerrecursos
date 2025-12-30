package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.model.Usuario;
import com.turismo.alquilerrecursos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username);
        if (usuario == null) {
            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
        }
        // Mapear rol de DB a autoridad Spring (prepend 'ROLE_')
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (usuario.getRol() != null && !usuario.getRol().isBlank()) {
            String rolNormalized = usuario.getRol().trim().toUpperCase();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + rolNormalized));
        }

        return new User(usuario.getUsername(), usuario.getPassword(), authorities);
    }
}