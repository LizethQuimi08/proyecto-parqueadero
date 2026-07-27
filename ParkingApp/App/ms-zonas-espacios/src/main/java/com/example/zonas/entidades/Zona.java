package com.example.zonas.entidades;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat ;

import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name ="zonas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Zona {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String tenantId;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, length = 12)
    private String codigo;

    @Column(nullable = true)
    private String descripcion;

    @Column(nullable = false)
    private Integer capacidad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoZona tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "espacio")
    private EstadoEspacio estado;

    @Column
    private boolean activo;

    @OneToMany(mappedBy = "zona",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<Espacio> espacios;

    @Column
    private LocalDateTime fechaCreacion;

    @Column
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "default";
        }
    }
}
