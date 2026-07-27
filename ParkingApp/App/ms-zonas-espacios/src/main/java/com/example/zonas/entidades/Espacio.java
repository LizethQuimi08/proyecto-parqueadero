package com.example.zonas.entidades;
import com.example.zonas.entidades.EstadoEspacio;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat ;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name ="espacio")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Espacio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String tenantId;

    @Column(nullable = false, length = 12)
    private String codigo; //ZON-VIP-01, ZON-VIP-02, ZON-VIP-03

    @Column(nullable = false, length = 20)
    private String nombre; //ZON-VIP-01-001, ZON-VIP-01-002, ZON-VIP-01-003

    @Column
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoEspacio tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEspacio estado;

    @Column
    private Boolean activo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona")
    private Zona zona;


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
