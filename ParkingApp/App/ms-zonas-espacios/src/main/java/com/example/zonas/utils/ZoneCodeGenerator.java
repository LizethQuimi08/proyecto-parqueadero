package com.example.zonas.utils;

import com.example.zonas.entidades.TipoZona;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Generador de códigos de zona automáticos
 * Formato: ZON-{TIPO}-{NUMERO}
 * Ejemplo: ZON-VIP-001, ZON-EST-001, ZON-GEN-001
 */
public class ZoneCodeGenerator {

    private static final AtomicInteger vipCounter = new AtomicInteger(0);
    private static final AtomicInteger estudiantesCounter = new AtomicInteger(0);
    private static final AtomicInteger generalCounter = new AtomicInteger(0);
    private static final AtomicInteger preferencialCounter = new AtomicInteger(0);

    /**
     * Genera un código de zona automáticamente basado en el tipo
     * @param tipoZona Tipo de zona (VIP, GEN, STANDARD)
     * @return Código generado (ej: ZON-VIP-001)
     */
    public static String generarCodigoZona(TipoZona tipoZona) {
        String prefijo = tipoZona.name().substring(0, 3).toUpperCase();
        AtomicInteger contador = getContadorPorTipo(tipoZona);
        int numero = contador.incrementAndGet();
        return String.format("ZON-%s-%03d", prefijo, numero);
    }

    /**
     * Genera el nombre de una zona basado en sus iniciales
     * Formato: ZON-TIPO o ZON-{PREFIJO}
     * @param nombre Nombre descriptivo de la zona
     * @param tipoZona Tipo de zona
     * @return Nombre generado
     */
    public static String generarNombreZona(String nombre, TipoZona tipoZona) {
        if (nombre == null || nombre.trim().isEmpty()) {
            return tipoZona.name();
        }
        return nombre.toUpperCase();
    }

    /**
     * Genera el código de un espacio dentro de una zona
     * Formato: {CODIGO_ZONA}-{NUMERO_SECUENCIAL}
     * @param codigoZona Código de la zona (ej: ZON-VIP-001)
     * @param numeroSecuencial Número secuencial del espacio (ej: 001, 002)
     * @return Código del espacio (ej: ZON-VIP-001-001)
     */
    public static String generarCodigoEspacio(String codigoZona, int numeroSecuencial) {
        return String.format("%s-%03d", codigoZona, numeroSecuencial);
    }

    /**
     * Obtiene el contador de acuerdo al tipo de zona
     */
    private static AtomicInteger getContadorPorTipo(TipoZona tipoZona) {
        return switch (tipoZona) {
            case VIP -> vipCounter;
            case ESTUDIANTES -> estudiantesCounter;
            case GENERAL -> generalCounter;
            case PREFERENCIAL -> preferencialCounter;
        };
    }

    /**
     * Reinicia los contadores (usar solo para testing)
     */
    public static void reiniciarContadores() {
        vipCounter.set(0);
        estudiantesCounter.set(0);
        generalCounter.set(0);
        preferencialCounter.set(0);
    }
}
