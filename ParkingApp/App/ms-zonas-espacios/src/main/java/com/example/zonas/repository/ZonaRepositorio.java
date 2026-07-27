package com.example.zonas.repository;

import com.example.zonas.entidades.TipoZona;
import com.example.zonas.entidades.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ZonaRepositorio extends JpaRepository<Zona, UUID> {

    boolean existsByTenantIdAndNombre(String tenantId, String nombre);

    long countByTenantIdAndTipo(String tenantId, TipoZona tipo);

    java.util.List<Zona> findByTenantId(String tenantId);

    java.util.List<Zona> findByTenantIdAndNombreContainingIgnoreCase(String tenantId, String nombre);

    java.util.List<Zona> findByNombreContainingIgnoreCase(String nombre);
}
