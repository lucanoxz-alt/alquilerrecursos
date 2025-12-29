/*
 * Archivo: SecurityConfig.java
 * Propósito: Configura la seguridad de la aplicación: CORS, autenticación,
 * autorización y filtros JWT. Añade comentarios explicativos en español.
 */

package com.turismo.alquilerrecursos.config;

import com.turismo.alquilerrecursos.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
/**
 * Configuración de seguridad de Spring Security para la aplicación.
 *
 * - Define CORS para el frontend (ej. http://localhost:5173).
 * - Desactiva CSRF apropiado para APIs REST.
 * - Establece gestión de sesiones sin estado (JWT).
 * - Declara rutas públicas y protege el resto con autenticación.
 * - Registra el filtro JWT y el proveedor de autenticación.
 */
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtAuthEntryPoint jwtAuthEntryPoint;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    /**
     * Bean que proporciona el codificador de contraseñas con BCrypt.
     * Se usa para almacenar y comparar contraseñas de usuarios de forma segura.
     */
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    /**
     * Configura el proveedor de autenticación basado en DAO.
     * - Usa `UserDetailsServiceImpl` para cargar usuarios desde la base de datos
     * - Usa el `PasswordEncoder` para verificar contraseñas
     */
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    /**
     * Bean que expone el `AuthenticationManager` utilizado por Spring Security.
     * Se obtiene de la `AuthenticationConfiguration` para permitir inyección en otros beans.
     */
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    /**
     * Configura CORS para permitir que el frontend (p.ej. Vite) haga peticiones a la API.
     * - `AllowedOrigins` contiene los orígenes permitidos (localhost:5173 durante desarrollo).
     * - `AllowedMethods` controla los métodos HTTP admitidos.
     * - `AllowedHeaders` permite cualquier encabezado.
     * - `AllowCredentials(true)` permite el envío de cookies/credenciales cuando sea necesario.
     */
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    /**
     * Configura la cadena de filtros de seguridad:
     * - Aplica CORS y deshabilita CSRF (API REST)
     * - Maneja excepciones vía `JwtAuthEntryPoint`
     * - Establece sesiones sin estado (JWT)
     * - Declara rutas públicas que no requieren autenticación
     * - Registra el `DaoAuthenticationProvider` y el filtro `JwtAuthFilter` antes del filtro de autenticación de usuario
     */
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(jwtAuthEntryPoint)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/boletas/**", "/api/comprobantes-pago/**", "/api/comprobantes-pago-reserva/**", "/api/comprobantes-electronicos/**").permitAll()
                .requestMatchers("/api/alquileres/*/ticket", "/api/alquileres/*/factura", "/api/alquileres/*/xml").permitAll()
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}