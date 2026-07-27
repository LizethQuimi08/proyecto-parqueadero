package com.example.zonas.dto.request;

import com.example.zonas.entidades.TipoEspacio;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class EspacioRequestDto {
    private UUID id;

    @Size(max = 500, message = "La descripción no puede tener más de 500 caracteres")
    private String descripcion;

    @NotNull(message = "El tipo de espacio no puede ser nulo")
    private TipoEspacio tipo;

    @NotNull(message = "El ID de la zona no puede ser nulo")
    private UUID idZona;
}

