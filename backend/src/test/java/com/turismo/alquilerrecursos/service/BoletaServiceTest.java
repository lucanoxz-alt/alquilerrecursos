package com.turismo.alquilerrecursos.service;

import com.turismo.alquilerrecursos.config.EmpresaProperties;
import com.turismo.alquilerrecursos.model.*;
import com.turismo.alquilerrecursos.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BoletaServiceTest {

    @InjectMocks
    private BoletaService boletaService;

    @Mock
    private AlquilerRepository alquilerRepository;
    @Mock
    private PagoRepository pagoRepository;
    @Mock
    private TuristaRepository turistaRepository;
    @Mock
    private DetalleAlquilerRepository detalleAlquilerRepository;
    @Mock
    private RecursoRepository recursoRepository;
    @Mock
    private EmpresaProperties empresaProperties;

    @BeforeEach
    public void setup() {
        // Work in headless mode for PDF generation
        System.setProperty("java.awt.headless", "true");

        when(empresaProperties.getNombre()).thenReturn("MiEmpresa");
        when(empresaProperties.getRuc()).thenReturn("20123456789");
        when(empresaProperties.getDireccion()).thenReturn("Av Test 123");
        when(empresaProperties.getTelefono()).thenReturn("999999999");
        when(empresaProperties.getEmail()).thenReturn("info@miempresa.com");
    }

    @Test
    public void testGenerarBoletaPDF_success() {
        String id = "ALQ010";

        Alquiler a = new Alquiler();
        a.setIdAlquiler(id);
        a.setIdTurista("T00001");
        a.setFechaHoraInicio(LocalDateTime.of(2025,12,27,19,46));
        a.setDuracionHoras(3);
        a.setCostoTotal(new BigDecimal("150.00"));
        a.setEstadoalquiler("Finalizado");

        when(alquilerRepository.findById(id)).thenReturn(Optional.of(a));

        Turista t = new Turista("Juan","Perez","12345678","Peru","999999999","j@p.com");
        t.setIdTurista("T00001");
        when(turistaRepository.findById("T00001")).thenReturn(Optional.of(t));

        Pago p = new Pago();
        p.setIdPago("P00001");
        p.setIdAlquiler(id);
        p.setSubtotal(new BigDecimal("127.12"));
        p.setDescuentoAplicado(new BigDecimal("0.00"));
        p.setTotalFinal(new BigDecimal("150.00"));
        p.setMontoPagado(new BigDecimal("150.00"));
        p.setFechaEmision(LocalDateTime.of(2025,12,27,19,46));
        p.setNumBoleta("B001");
        p.setMetodoPago("Efectivo");
        when(pagoRepository.findByIdAlquiler(id)).thenReturn(p);

        DetalleAlquiler d = new DetalleAlquiler();
        d.setIdDetalle("D1");
        d.setIdAlquiler(id);
        d.setIdRecurso("R1");
        d.setHorasRealizadas(3);
        d.setCostoParcial(new BigDecimal("150.00"));
        when(detalleAlquilerRepository.findByIdAlquiler(id)).thenReturn(List.of(d));

        Recurso r = new Recurso();
        r.setIdRecurso("R1");
        r.setNombre("Silla de Playa");
        r.setTarifaHora(new BigDecimal("50.00"));
        when(recursoRepository.findById("R1")).thenReturn(Optional.of(r));

        byte[] pdf = boletaService.generarBoletaPDF(id);
        assertNotNull(pdf, "PDF bytes should not be null");
        assertTrue(pdf.length > 100, "PDF should have content");
    }

    @Test
    public void testGenerarBoletaHTML_containsNumBoleta() {
        String id = "ALQ020";
        Alquiler a = new Alquiler();
        a.setIdAlquiler(id);
        a.setIdTurista("T00002");
        a.setFechaHoraInicio(LocalDateTime.of(2025,12,27,10,0));
        a.setDuracionHoras(2);
        a.setCostoTotal(new BigDecimal("80.00"));
        a.setEstadoalquiler("Finalizado");
        when(alquilerRepository.findById(id)).thenReturn(Optional.of(a));

        Turista t = new Turista("Ana","Lopez","87654321","Peru","98888888","a@l.com");
        t.setIdTurista("T00002");
        when(turistaRepository.findById("T00002")).thenReturn(Optional.of(t));

        Pago p = new Pago();
        p.setIdPago("P00002");
        p.setIdAlquiler(id);
        p.setSubtotal(new BigDecimal("67.80"));
        p.setDescuentoAplicado(new BigDecimal("0.00"));
        p.setTotalFinal(new BigDecimal("80.00"));
        p.setMontoPagado(new BigDecimal("80.00"));
        p.setFechaEmision(LocalDateTime.of(2025,12,27,10,0));
        p.setNumBoleta("B002");
        when(pagoRepository.findByIdAlquiler(id)).thenReturn(p);

        DetalleAlquiler d = new DetalleAlquiler();
        d.setIdDetalle("D2");
        d.setIdAlquiler(id);
        d.setIdRecurso("R2");
        d.setHorasRealizadas(2);
        d.setCostoParcial(new BigDecimal("80.00"));
        when(detalleAlquilerRepository.findByIdAlquiler(id)).thenReturn(List.of(d));

        Recurso r = new Recurso();
        r.setIdRecurso("R2");
        r.setNombre("Parasol");
        r.setTarifaHora(new BigDecimal("40.00"));
        when(recursoRepository.findById("R2")).thenReturn(Optional.of(r));

        String html = boletaService.generarBoletaHTML(id);
        assertNotNull(html);
        assertTrue(html.contains("B002") || html.contains("Num"), "HTML should contain boleta number or label");
    }
}
