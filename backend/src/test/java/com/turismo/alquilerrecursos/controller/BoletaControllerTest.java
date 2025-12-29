package com.turismo.alquilerrecursos.controller;

import com.turismo.alquilerrecursos.service.BoletaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = BoletaController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
public class BoletaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BoletaService boletaService;

    // Mock security helpers used by JwtAuthFilter to avoid missing beans during WebMvcTest
    @org.springframework.boot.test.mock.mockito.MockBean
    private com.turismo.alquilerrecursos.config.JwtUtil jwtUtil;

    @org.springframework.boot.test.mock.mockito.MockBean
    private com.turismo.alquilerrecursos.service.UserDetailsServiceImpl userDetailsService;

    @Test
    public void generarBoletaPDF_ReturnsPdf() throws Exception {
        byte[] sample = new byte[] {0x25, 0x50, 0x44, 0x46}; // "%PDF" magic bytes
        Mockito.when(boletaService.generarBoletaPDF(anyString())).thenReturn(sample);

        mockMvc.perform(get("/api/boletas/ALQ010/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("boleta_ALQ010.pdf")))
                .andExpect(content().bytes(sample));
    }
}
