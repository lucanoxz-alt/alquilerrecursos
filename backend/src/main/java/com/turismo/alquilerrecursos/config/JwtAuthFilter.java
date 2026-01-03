// src/main/java/com/turismo/alquilerrecursos/config/JwtAuthFilter.java
package com.turismo.alquilerrecursos.config;

import com.turismo.alquilerrecursos.service.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtAuthFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String jwt = parseJwt(request);

        // Short-circuit: si es una petición a comprobantes públicos, no procesar el token para evitar 401s por tokens mal formados
        if (isPublicComprobanteRequest(request)) {
            logger.debug("Petición a comprobante públicamente accesible: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        if (StringUtils.hasText(jwt)) {
            try {
                String username = jwtUtil.extractUsername(jwt);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Cargar los detalles del usuario desde la base de datos
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // Si el usuario no existe, rechazar la solicitud
                    if (userDetails == null) {
                        logger.warn("Usuario no encontrado: " + username);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        return; // Salir inmediatamente
                    }

                    // Validar el token con los detalles del usuario cargado
                    if (userDetails != null && jwtUtil.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities() != null ? userDetails.getAuthorities() : Collections.emptyList()
                            );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.debug("Token JWT autenticado para el usuario: " + username);
                    } else if (userDetails != null) {
                        logger.warn("Token JWT inválido para el usuario: " + username);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        return; // Salir inmediatamente
                    }
                }
            } catch (io.jsonwebtoken.ExpiredJwtException eje) {
                logger.debug("Token JWT expirado", eje);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            } catch (Exception e) {
                logger.warn("Error al procesar el token JWT: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return; // Salir inmediatamente
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicComprobanteRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return false;
        // Permitir acceso público a comprobantes y endpoints relacionados (boleta/factura/xml/pdf)
        if (uri.startsWith("/api/comprobantes-pago/")) return true;
        if (uri.startsWith("/api/comprobantes-pago-reserva/")) return true;
        if (uri.startsWith("/api/boletas/")) return true;
        if (uri.startsWith("/api/comprobantes-electronicos/")) return true;
        // Endpoints no utilizados de factura/xml removidos; no es necesario marcarlos pablicos
        // /api/alquileres/{id}/ticket | /factura | /xml | /pdf
        if (uri.matches("/api/alquileres/.*/(ticket|factura|xml|pdf)$")) return true;
        // fallback permisivo: cualquier endpoint que termine en ticket/factura/xml/pdf
        if (uri.endsWith("/ticket") || uri.endsWith("/factura") || uri.endsWith("/xml") || uri.endsWith("/pdf")) return true;
        return false;
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}