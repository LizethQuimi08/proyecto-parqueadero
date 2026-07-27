package com.example.zonas.repository;

import com.example.zonas.entidades.Espacio;
import com.example.zonas.entidades.EstadoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EspacioRepositorio extends JpaRepository<Espacio, UUID> {

    List<Espacio> findByZonaId(UUID zonaId);

    List<Espacio> findByTenantId(String tenantId);

    long countByZonaId(UUID zonaId);

    List<Espacio> findByZonaIdAndEstado(UUID zonaId, EstadoEspacio estado);

    List<Espacio> findByTenantIdAndZonaIdAndEstado(String tenantId, UUID zonaId, EstadoEspacio estado);

    List<Espacio> findByTenantIdAndEstado(String tenantId, EstadoEspacio estado);

    List<Espacio> findByEstado(EstadoEspacio estado);

}
