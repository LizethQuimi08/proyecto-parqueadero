package com.example.zonas.dto.response;

import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.TipoEspacio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EspacioResponseDto {
    private UUID id;
    private String tenantId;
    private String nombre; //ZON-VIP-01-001
    private String descripcion;
    private TipoEspacio tipo;
    private Boolean activo;
    private String nombreZona;
    private UUID idZona;
    private EstadoEspacio estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}
