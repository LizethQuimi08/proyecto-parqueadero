package ec.edu.espe.usuarios.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String tenantId;
    private Boolean active;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private PersonResponse person;


}
