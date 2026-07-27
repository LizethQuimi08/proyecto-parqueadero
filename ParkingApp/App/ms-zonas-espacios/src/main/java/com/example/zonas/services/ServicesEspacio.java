package com.example.zonas.services;

import com.example.zonas.dto.request.EspacioRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.entidades.Espacio;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.Zona;
import com.example.zonas.repository.EspacioRepositorio;
import com.example.zonas.repository.ZonaRepositorio;
import com.example.zonas.services.interfaz.EspacioService;
import com.example.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicesEspacio implements EspacioService {

    private final MapperUtils mapper;
    private final EspacioRepositorio espacioRepositorio;
    private final ZonaRepositorio zonaRepositorio;
    private final EspacioSseService espacioSseService;

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspacios(String tenantId) {
        if (isGlobalScope(tenantId)) {
            return espacioRepositorio.findAll().stream()
                    .map(mapper::toEspacioResponseDto)
                    .collect(Collectors.toList());
        }
        return espacioRepositorio.findByTenantId(normalizeTenantId(tenantId)).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EspacioResponseDto crearEspacio(EspacioRequestDto requestDto, String tenantId) {
        Zona zona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + requestDto.getIdZona()));
        validarTenant(zona.getTenantId(), tenantId);

        long espaciosExistentes = espacioRepositorio.countByZonaId(zona.getId());
        
        
        if (espaciosExistentes >= zona.getCapacidad()) {
            throw new IllegalStateException(
                    "No se pueden crear más espacios. Capacidad máxima de la zona alcanzada: " + zona.getCapacidad()
            );
        }

        Espacio espacio = mapper.toEspacioEntity(requestDto);
        espacio.setTenantId(normalizeTenantId(tenantId));
        espacio.setZona(zona);
        espacio.setCodigo(zona.getCodigo());
        espacio.setNombre(generarNombreEspacio(zona));
        espacio.setEstado(EstadoEspacio.DISPONIBLE);
        espacio.setActivo(true);
        espacio.setFechaCreacion(LocalDateTime.now());
        espacio.setFechaActualizacion(LocalDateTime.now());

        return mapper.toEspacioResponseDto(espacioRepositorio.save(espacio));
    }

    @Override
    @Transactional
    public EspacioResponseDto actualizarEspacio(UUID id, EspacioRequestDto requestDto, String tenantId) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        validarTenant(espacio.getTenantId(), tenantId);

        Zona nuevaZona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + requestDto.getIdZona()));
        validarTenant(nuevaZona.getTenantId(), tenantId);

        espacio.setDescripcion(requestDto.getDescripcion());
        espacio.setTipo(requestDto.getTipo());

        if (!nuevaZona.getId().equals(espacio.getZona().getId())) {
            long espaciosExistentes = espacioRepositorio.countByZonaId(nuevaZona.getId());

            if (espaciosExistentes >= nuevaZona.getCapacidad()) {
                throw new IllegalStateException(
                        "No se pueden mover espacios. Capacidad máxima de la zona alcanzada: " + nuevaZona.getCapacidad()
                );
            }

            espacio.setZona(nuevaZona);
            espacio.setTenantId(nuevaZona.getTenantId());
            espacio.setCodigo(nuevaZona.getCodigo());
            espacio.setNombre(generarNombreEspacio(nuevaZona));
        }

        espacio.setFechaActualizacion(LocalDateTime.now());
        return mapper.toEspacioResponseDto(espacioRepositorio.save(espacio));
    }

    @Override
    @Transactional
    public void eliminarEspacio(UUID id, String tenantId) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        validarTenant(espacio.getTenantId(), tenantId);

        espacio.setActivo(false);
        espacio.setFechaActualizacion(LocalDateTime.now());
        espacioRepositorio.save(espacio);
    }

    @Override
    @Transactional
    public EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado, String tenantId) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        validarTenant(espacio.getTenantId(), tenantId);

        espacio.setEstado(estado);
        espacio.setActivo(estado != EstadoEspacio.MANTENIMIENTO);
        espacio.setFechaActualizacion(LocalDateTime.now());

        EspacioResponseDto response = mapper.toEspacioResponseDto(espacioRepositorio.save(espacio));
        espacioSseService.emitirCambioEstado(response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado, String tenantId) {
        EstadoEspacio estadoEnum = parseEstado(estado);
        if (isGlobalScope(tenantId)) {
            return espacioRepositorio.findByEstado(estadoEnum).stream()
                    .map(mapper::toEspacioResponseDto)
                    .collect(Collectors.toList());
        }
        return espacioRepositorio.findByTenantIdAndEstado(normalizeTenantId(tenantId), estadoEnum).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona, String tenantId) {
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));
        validarTenant(zona.getTenantId(), tenantId);

        return espacioRepositorio.findByZonaId(zona.getId()).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado, String tenantId) {
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));
        validarTenant(zona.getTenantId(), tenantId);

        EstadoEspacio estadoEnum = parseEstado(estado);
        if (isGlobalScope(tenantId)) {
            return espacioRepositorio.findByZonaIdAndEstado(zona.getId(), estadoEnum).stream()
                    .map(mapper::toEspacioResponseDto)
                    .collect(Collectors.toList());
        }
        return espacioRepositorio.findByTenantIdAndZonaIdAndEstado(normalizeTenantId(tenantId), zona.getId(), estadoEnum).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    private String generarNombreEspacio(Zona zona) {
        long numero = espacioRepositorio.countByZonaId(zona.getId()) + 1;
        return String.format("%s-%03d", zona.getCodigo(), numero);
    }

    @Override
    @Transactional(readOnly = true)
    public EspacioResponseDto obtenerEspacioPorId(UUID id, String tenantId) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        validarTenant(espacio.getTenantId(), tenantId);
        return mapper.toEspacioResponseDto(espacio);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosDisponiblesPorNombreZona(String nombreZona, String tenantId) {
        String normalizedTenantId = normalizeTenantId(tenantId);
        List<Zona> zonas = isGlobalScope(tenantId)
                ? zonaRepositorio.findByNombreContainingIgnoreCase(nombreZona)
                : zonaRepositorio.findByTenantIdAndNombreContainingIgnoreCase(normalizedTenantId, nombreZona);
        return zonas.stream()
                .flatMap(zona -> isGlobalScope(tenantId)
                        ? espacioRepositorio.findByZonaIdAndEstado(zona.getId(), EstadoEspacio.DISPONIBLE).stream()
                        : espacioRepositorio.findByTenantIdAndZonaIdAndEstado(normalizedTenantId, zona.getId(), EstadoEspacio.DISPONIBLE).stream())
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
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

    private EstadoEspacio parseEstado(String estado) {
        try {
            return EstadoEspacio.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estado + ". Validos: DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO");
        }
    }
}
