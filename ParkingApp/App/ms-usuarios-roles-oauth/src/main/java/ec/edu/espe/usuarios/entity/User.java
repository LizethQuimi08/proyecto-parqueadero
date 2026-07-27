package ec.edu.espe.usuarios.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn
    private Person person;

    @Column(nullable = false, unique = true, length = 20)
    private String username;

    @Column(nullable = false, length = 50)
    private String tenantId;

    @Column(nullable = false, length = 60)
    private String passwordHash;

    @Column
    private Boolean active;

    @Column
    private LocalDateTime lastLogin;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.tenantId == null || this.tenantId.isBlank()) {
            this.tenantId = "default";
        }
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }
}
