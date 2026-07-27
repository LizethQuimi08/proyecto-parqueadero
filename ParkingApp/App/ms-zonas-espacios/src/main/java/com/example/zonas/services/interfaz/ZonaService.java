package com.example.zonas.services.interfaz;

import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;

import java.util.List;
import java.util.UUID;

public interface ZonaService {

    List<ZonaResponseDto> listarZonas(String tenantId);

    ZonaResponseDto crearZona(ZonaRequestDto requestDto, String tenantId);

    ZonaResponseDto actualizarZona(UUID id, ZonaRequestDto requestDto, String tenantId);

    void eliminarZona(UUID id, String tenantId);

    List<ZonaResponseDto> buscarZonas(String nombre, String tenantId);
}
