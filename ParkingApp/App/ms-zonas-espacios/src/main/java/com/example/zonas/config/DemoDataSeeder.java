package com.example.zonas.config;

import com.example.zonas.entidades.Espacio;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.TipoEspacio;
import com.example.zonas.entidades.TipoZona;
import com.example.zonas.entidades.Zona;
import com.example.zonas.repository.EspacioRepositorio;
import com.example.zonas.repository.ZonaRepositorio;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {
    private final ZonaRepositorio zonaRepositorio;
    private final EspacioRepositorio espacioRepositorio;

    @Override
    @Transactional
    public void run(String... args) {
        seedEmpresa1();
        seedEmpresa2();
    }

    private void seedEmpresa1() {
        Zona norteVip = seedZona("empresa1", "NORTE VIP", "ZON-VIP-01", "Acceso norte cubierto", 6, TipoZona.VIP);
        seedEspacios(norteVip, List.of(
                espacio("NORTE-VIP-001", TipoEspacio.CUBIERTO, EstadoEspacio.DISPONIBLE),
                espacio("NORTE-VIP-002", TipoEspacio.CUBIERTO, EstadoEspacio.OCUPADO),
                espacio("NORTE-VIP-003", TipoEspacio.ACCESIBLE, EstadoEspacio.RESERVADO)
        ));

        Zona generalA = seedZona("empresa1", "GENERAL A", "ZON-GEN-01", "Zona general empresa 1", 12, TipoZona.GENERAL);
        seedEspacios(generalA, List.of(
                espacio("GEN-A-001", TipoEspacio.DESCUBIERTO, EstadoEspacio.DISPONIBLE),
                espacio("GEN-A-002", TipoEspacio.DESCUBIERTO, EstadoEspacio.DISPONIBLE),
                espacio("GEN-A-003", TipoEspacio.DESCUBIERTO, EstadoEspacio.MANTENIMIENTO)
        ));
    }

    private void seedEmpresa2() {
        Zona surAdmin = seedZona("empresa2", "SUR ADMIN", "ZON-PRE-01", "Zona preferencial administrativa", 5, TipoZona.PREFERENCIAL);
        seedEspacios(surAdmin, List.of(
                espacio("SUR-ADM-001", TipoEspacio.CUBIERTO, EstadoEspacio.DISPONIBLE),
                espacio("SUR-ADM-002", TipoEspacio.ACCESIBLE, EstadoEspacio.OCUPADO),
                espacio("SUR-ADM-003", TipoEspacio.CUBIERTO, EstadoEspacio.DISPONIBLE)
        ));

        Zona estudiantes = seedZona("empresa2", "ESTUDIANTES B", "ZON-EST-01", "Zona estudiantil empresa 2", 15, TipoZona.ESTUDIANTES);
        seedEspacios(estudiantes, List.of(
                espacio("EST-B-001", TipoEspacio.DESCUBIERTO, EstadoEspacio.DISPONIBLE),
                espacio("EST-B-002", TipoEspacio.DESCUBIERTO, EstadoEspacio.RESERVADO),
                espacio("EST-B-003", TipoEspacio.DESCUBIERTO, EstadoEspacio.MANTENIMIENTO)
        ));
    }

    private Zona seedZona(String tenantId, String nombre, String codigo, String descripcion, int capacidad, TipoZona tipo) {
        return zonaRepositorio.findByTenantIdAndNombreContainingIgnoreCase(tenantId, nombre).stream()
                .filter(zona -> nombre.equalsIgnoreCase(zona.getNombre()))
                .findFirst()
                .orElseGet(() -> {
                    Zona zona = Zona.builder()
                            .tenantId(tenantId)
                            .nombre(nombre)
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .capacidad(capacidad)
                            .tipo(tipo)
                            .estado(EstadoEspacio.DISPONIBLE)
                            .activo(true)
                            .fechaCreacion(LocalDateTime.now())
                            .fechaActualizacion(LocalDateTime.now())
                            .build();
                    Zona saved = zonaRepositorio.save(zona);
                    log.info("Zona demo creada para {}: {}", tenantId, nombre);
                    return saved;
                });
    }

    private void seedEspacios(Zona zona, List<DemoEspacio> espacios) {
        long existentes = espacioRepositorio.countByZonaId(zona.getId());
        if (existentes > 0) {
            return;
        }

        espacios.forEach(demo -> {
            Espacio espacio = Espacio.builder()
                    .tenantId(zona.getTenantId())
                    .codigo(zona.getCodigo())
                    .nombre(demo.nombre())
                    .descripcion("Demo " + zona.getNombre())
                    .tipo(demo.tipo())
                    .estado(demo.estado())
                    .activo(demo.estado() != EstadoEspacio.MANTENIMIENTO)
                    .zona(zona)
                    .fechaCreacion(LocalDateTime.now())
                    .fechaActualizacion(LocalDateTime.now())
                    .build();
            espacioRepositorio.save(espacio);
        });
        log.info("Espacios demo creados para zona {}", zona.getNombre());
    }

    private DemoEspacio espacio(String nombre, TipoEspacio tipo, EstadoEspacio estado) {
        return new DemoEspacio(nombre, tipo, estado);
    }

    private record DemoEspacio(String nombre, TipoEspacio tipo, EstadoEspacio estado) {
    }
}
