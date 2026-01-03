package com.turismo.alquilerrecursos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "empresa")
public class EmpresaProperties {
    private String nombre = "AlquilerPlaya";
    private String ruc = "00000000000";
    private String direccion = "";
    private String telefono = "";
    private String email = "";
    private String logoUrl = "";
    private java.math.BigDecimal igvRate = new java.math.BigDecimal("0.18");

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public java.math.BigDecimal getIgvRate() { return igvRate; }
    public void setIgvRate(java.math.BigDecimal igvRate) { this.igvRate = igvRate; }
}
