package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.ComprobantePagoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = ComprobantePagoController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
public class ComprobantePagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ComprobantePagoService service;

    // Mock security helpers used by JwtAuthFilter to avoid missing beans during WebMvcTest
    @org.springframework.boot.test.mock.mockito.MockBean
    private com.turismo.alquilerrecursos.config.JwtUtil jwtUtil;

    @org.springframework.boot.test.mock.mockito.MockBean
    private com.turismo.alquilerrecursos.service.UserDetailsServiceImpl userDetailsService;

    @Test
    public void pdfPorAlquiler_ReturnsPdf() throws Exception {
        byte[] sample = new byte[] {0x25, 0x50, 0x44, 0x46}; // "%PDF" magic bytes
        Mockito.when(service.generarDatosComprobantePagoPorAlquiler(anyString())).thenReturn(Map.of("pago", Map.of("num", "B001")));
        Mockito.when(service.generarPDFDesdeDatos(Mockito.any())).thenReturn(sample);

        mockMvc.perform(get("/api/comprobantes-pago/alquiler/ALQ010/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("comprobante_ALQ010.pdf")))
                .andExpect(content().bytes(sample));
    }
}
