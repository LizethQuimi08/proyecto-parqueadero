package com.example.zonas.dto.request;

import com.example.zonas.entidades.TipoZona;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class ZonaRequestDto {

    @NotNull(message = "El nombre de la Zona no puede ser nulo")
    @NotBlank(message = "El nombre de la Zona no puede estar vacío")
    @Size(min = 2, max = 50, message = "El nombre de la Zona debe tener entre 2 y 50 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9\\s-]+$", message = "El nombre solo puede contener letras, números, espacios y guiones")
    private String nombre;

    @Size(max = 500, message = "La descripción no puede tener más de 500 caracteres")
    private String descripcion;

    @NotNull(message = "La capacidad es un campo obligatorio")
    @Min(value = 1, message = "La capacidad de la Zona debe ser un número positivo")
    @Max(value = 200, message = "La capacidad de la Zona no puede ser mayor a 200")
    private Integer capacidad;

    @NotNull(message = "El tipo de zona no puede ser nulo")
    private TipoZona tipo;
}
