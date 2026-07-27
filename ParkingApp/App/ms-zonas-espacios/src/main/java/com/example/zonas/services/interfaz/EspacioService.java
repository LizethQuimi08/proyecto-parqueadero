package com.example.zonas.services.interfaz;

import com.example.zonas.dto.request.EspacioRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EspacioService {

    List<EspacioResponseDto> obtenerEspacios(String tenantId);

    EspacioResponseDto crearEspacio(EspacioRequestDto requestDto, String tenantId);

    EspacioResponseDto actualizarEspacio(UUID id, EspacioRequestDto requestDto, String tenantId);

    void eliminarEspacio(UUID id, String tenantId);

    EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado, String tenantId);

    List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado, String tenantId);

    List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona, String tenantId);

    List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado, String tenantId);

    EspacioResponseDto obtenerEspacioPorId(UUID id, String tenantId);

    List<EspacioResponseDto> obtenerEspaciosDisponiblesPorNombreZona(String nombreZona, String tenantId);

}
