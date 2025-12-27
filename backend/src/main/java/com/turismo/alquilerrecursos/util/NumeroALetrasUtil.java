package com.turismo.alquilerrecursos.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class NumeroALetrasUtil {
    private static final String[] UNIDADES = {"", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"};
    private static final String[] DECENAS = {"", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"};
    private static final String[] CENTENAS = {"", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"};

    public static String aMonedaPeru(BigDecimal monto) {
        if (monto == null) monto = BigDecimal.ZERO;
        BigDecimal m = monto.setScale(2, RoundingMode.HALF_UP);
        long enteros = m.longValue();
        int centimos = m.remainder(BigDecimal.ONE).movePointRight(2).abs().intValue();
        String letras = (enteros == 0) ? "cero" : aLetras(enteros);
        return capitalize(letras.trim()) + " con " + String.format("%02d", centimos) + "/100 Soles";
    }

    public static String aLetras(long num) {
        if (num == 0) return "cero";
        if (num < 0) return "menos " + aLetras(-num);
        StringBuilder sb = new StringBuilder();
        if (num >= 1_000_000_000) {
            sb.append(aLetras(num / 1_000_000_000)).append(" mil millones ");
            num %= 1_000_000_000;
        }
        if (num >= 1_000_000) {
            long millones = num / 1_000_000;
            sb.append(millones == 1 ? "un millón" : aLetras(millones) + " millones").append(' ');
            num %= 1_000_000;
        }
        if (num >= 1000) {
            long miles = num / 1000;
            sb.append(miles == 1 ? "mil" : aLetras(miles) + " mil").append(' ');
            num %= 1000;
        }
        if (num >= 100) {
            int c = (int)(num / 100);
            if (c == 1 && num % 100 != 0) sb.append("ciento ");
            else sb.append(CENTENAS[c]).append(' ');
            num %= 100;
        }
        if (num > 20) {
            int d = (int)(num / 10);
            int u = (int)(num % 10);
            sb.append(DECENAS[d]);
            if (u > 0) sb.append(" y ").append(UNIDADES[u]);
        } else {
            sb.append(UNIDADES[(int)num]);
        }
        String res = sb.toString().replaceAll("\\s+", " ").trim();
        // ajustes lingüísticos
        res = res.replaceAll("uno(\\s|$)", "un ");
        res = res.replace("veinte y ", "veinti");
        return res.trim();
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
