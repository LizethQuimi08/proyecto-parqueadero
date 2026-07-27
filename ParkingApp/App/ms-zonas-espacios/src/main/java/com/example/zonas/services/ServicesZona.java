package com.example.zonas.services;

import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.TipoZona;
import com.example.zonas.entidades.Zona;
import com.example.zonas.repository.ZonaRepositorio;
import com.example.zonas.services.interfaz.ZonaService;
import com.example.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicesZona implements ZonaService {

    private final MapperUtils mapper;
    private final ZonaRepositorio zonaRepositorio;

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> listarZonas(String tenantId) {
        if (isGlobalScope(tenantId)) {
            return zonaRepositorio.findAll().stream()
                    .map(mapper::toZonaResponseDto)
                    .collect(Collectors.toList());
        }
        return zonaRepositorio.findByTenantId(normalizeTenantId(tenantId)).stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto, String tenantId) {
        String normalizedTenantId = normalizeTenantId(tenantId);
        String nombreNormalizado = generarNombreZona(requestDto.getNombre());
        if (zonaRepositorio.existsByTenantIdAndNombre(normalizedTenantId, nombreNormalizado)) {
            throw new IllegalArgumentException("Ya existe una zona con el nombre: " + requestDto.getNombre());
        }

        Zona zona = mapper.toZonaEntity(requestDto);
        zona.setTenantId(normalizedTenantId);
        zona.setCodigo(generarCodigoZona(requestDto.getTipo(), normalizedTenantId));
        zona.setNombre(nombreNormalizado);
        zona.setEstado(EstadoEspacio.DISPONIBLE);
        zona.setActivo(true);
        zona.setFechaCreacion(LocalDateTime.now());
        zona.setFechaActualizacion(LocalDateTime.now());

        return mapper.toZonaResponseDto(zonaRepositorio.save(zona));
    }

    @Override
    @Transactional
    public ZonaResponseDto actualizarZona(UUID idZone, ZonaRequestDto requestDto, String tenantId) {
        Zona zona = zonaRepositorio.findById(idZone)
                .orElseThrow(() -> new IllegalArgumentException("No existe zona con id: " + idZone));
        validarTenant(zona.getTenantId(), tenantId);

        if (!zona.getTipo().equals(requestDto.getTipo())) {
            zona.setCodigo(generarCodigoZona(requestDto.getTipo(), zona.getTenantId()));
        }

        BeanUtils.copyProperties(requestDto, zona, "id", "fechaCreacion", "activo", "estado", "codigo");
        zona.setFechaActualizacion(LocalDateTime.now());

        return mapper.toZonaResponseDto(zonaRepositorio.save(zona));
    }

    @Override
    @Transactional
    public void eliminarZona(UUID id, String tenantId) {
        Zona zona = zonaRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe zona con id: " + id));
        validarTenant(zona.getTenantId(), tenantId);

        if (zona.getEspacios() != null && !zona.getEspacios().isEmpty()) {
            boolean tieneEspaciosNoDisponibles = zona.getEspacios().stream()
                    .anyMatch(espacio -> espacio.getEstado() != EstadoEspacio.DISPONIBLE);
            if (tieneEspaciosNoDisponibles) {
                throw new IllegalStateException("No se puede eliminar la zona porque hay espacios ocupados, reservados o en mantenimiento");
            }
        }

        zonaRepositorio.delete(zona);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> buscarZonas(String nombre, String tenantId) {
        if (isGlobalScope(tenantId)) {
            return zonaRepositorio.findByNombreContainingIgnoreCase(nombre).stream()
                    .map(mapper::toZonaResponseDto)
                    .collect(Collectors.toList());
        }
        return zonaRepositorio.findByTenantIdAndNombreContainingIgnoreCase(normalizeTenantId(tenantId), nombre).stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());
    }

    private String generarCodigoZona(TipoZona tipo, String tenantId) {
        String tipoPrefijo = tipo == TipoZona.GENERAL ? "GEN" : tipo.name().substring(0, Math.min(tipo.name().length(), 3));
        long cuenta = zonaRepositorio.countByTenantIdAndTipo(tenantId, tipo) + 1;
        return String.format("ZON-%s-%02d", tipoPrefijo, cuenta);
    }

    private String normalizeTenantId(String tenantId) {
        return tenantId == null || tenantId.isBlank() ? "default" : tenantId.trim();
    }

    private void validarTenant(String actualTenantId, String requestedTenantId) {
        if (isGlobalScope(requestedTenantId)) {
            return;
        }
        if (!normalizeTenantId(actualTenantId).equals(normalizeTenantId(requestedTenantId))) {
            throw new IllegalArgumentException("Recurso no encontrado para el tenant actual");
        }
    }

    private boolean isGlobalScope(String tenantId) {
        return "__all__".equals(tenantId);
    }

    private String generarNombreZona(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la zona no puede estar vacío");
        }
        return nombre.trim().toUpperCase();
    }
}
