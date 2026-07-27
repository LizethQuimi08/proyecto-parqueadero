package com.example.zonas.utils;

import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.entidades.Espacio;
import com.example.zonas.entidades.Zona;
import org.springframework.stereotype.Component;
import com.example.zonas.dto.request.EspacioRequestDto;

import java.util.UUID;

@Component
public class MapperUtils {

    public ZonaResponseDto toZonaResponseDto(Zona objzona) {

        if (objzona == null) return null;

        return ZonaResponseDto.builder()
                .id(objzona.getId())
                .tenantId(objzona.getTenantId())
                .nombre(objzona.getNombre())
                .codigo(objzona.getCodigo())
                .descripcion(objzona.getDescripcion())
                .capacidad(objzona.getCapacidad())
                .tipo(objzona.getTipo())
                .estado(objzona.getEstado())
                .activo(objzona.isActivo())
                .fechaCreacion(objzona.getFechaCreacion())
                .fechaActualizacion(objzona.getFechaActualizacion())
                .espacios(objzona.getEspacios() != null ? objzona.getEspacios().size() : 0)
                .build();
    }

    public Zona toZonaEntity(ZonaRequestDto dto) {
        if (dto == null) return null;

        return Zona.builder()
                .nombre(dto.getNombre())
                .descripcion(dto.getDescripcion())
                .capacidad(dto.getCapacidad())
                .tipo(dto.getTipo())
                .build();
    }

    public EspacioResponseDto toEspacioResponseDto(Espacio espacio) {
        if (espacio == null) return null;

        return EspacioResponseDto.builder()
                .id(espacio.getId())
                .tenantId(espacio.getTenantId())
                .nombre(espacio.getNombre())
                .descripcion(espacio.getDescripcion())
                .tipo(espacio.getTipo())
                .activo(espacio.getActivo())
                .nombreZona(espacio.getZona() != null ? espacio.getZona().getNombre() : "")
                .idZona(espacio.getZona() != null ? espacio.getZona().getId() : null)
                .estado(espacio.getEstado())
                .fechaCreacion(espacio.getFechaCreacion())
                .fechaActualizacion(espacio.getFechaActualizacion())
                .build();
    }

    public Espacio toEspacioEntity(EspacioRequestDto dto) {
        if (dto == null) return null;

        return Espacio.builder()
                .descripcion(dto.getDescripcion())
                .tipo(dto.getTipo())
                .build();
    }
}
