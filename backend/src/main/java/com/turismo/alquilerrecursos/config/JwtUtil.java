/*
 * Archivo: JwtUtil.java
 * Propósito: Utilidades para generar y validar JSON Web Tokens (JWT) usados por la autenticación.
 */

package com.turismo.alquilerrecursos.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Clase responsable de generar y validar JWT (JSON Web Tokens).
 *
 * Detalles:
 * - Lee la clave secreta y el tiempo de expiración desde `JwtProperties`.
 * - Genera tokens firmados con HS512 y provee utilidades para extraer usuario y comprobar
 *   si un token está expirado.
 */
@Component
public class JwtUtil {

    /** Configuración con la clave secreta y tiempo de expiración (ms). */
    private final JwtProperties jwtProperties;

    /**
     * Constructor inyectado con la configuración de JWT.
     * @param jwtProperties propiedades de configuración del JWT (secret, expiration)
     */
    public JwtUtil(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    /**
     * Obtiene la clave de firma (HMAC) a partir del secret configurado.
     * Se utiliza `Keys.hmacShaKeyFor` para construir un objeto `Key` compatible con HS512.
     * @return clave de firma para firmar/verificar los JWT
     */
    private Key getSigningKey() {
        // Convertimos el secret (String) a bytes y construimos la clave HMAC
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
    }

    /**
     * Genera un JWT para el usuario proporcionado.
     * El token contiene el nombre de usuario como `subject`, la fecha de emisión y la
     * fecha de expiración calculada usando `jwtProperties.getExpiration()` (ms).
     * @param userDetails detalles del usuario (se usa username como subject)
     * @return token JWT firmado
     */
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                // Subject: normalmente el identificador del usuario (username)
                .setSubject(userDetails.getUsername())
                // Fecha de emisión
                .setIssuedAt(new Date())
                // Fecha de expiración (ahora + duración configurada)
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                // Firmamos con HS512 usando la clave derivada de la propiedad secret
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Valida que el token pertenezca al usuario y que no esté expirado.
     * @param token JWT recibido
     * @param userDetails detalles del usuario esperado
     * @return true si el token es válido y corresponde al usuario
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // Comprobamos que el subject coincida con el username y que no esté expirado
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Extrae el `subject` (username) contenido en el JWT.
     * Lanza excepción si el token no es válido o la firma no coincide.
     * @param token JWT a parsear
     * @return username almacenado en el subject del token
     */
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Comprueba si la fecha de expiración del token ya ha pasado.
     * @param token JWT a comprobar
     * @return true si el token está expirado
     */
    private boolean isTokenExpired(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration()
                .before(new Date());
    }
}