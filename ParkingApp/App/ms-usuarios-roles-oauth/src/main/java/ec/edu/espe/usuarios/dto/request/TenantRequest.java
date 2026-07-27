package ec.edu.espe.usuarios.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TenantRequest {
    @NotBlank
    @Size(max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$")
    private String id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String plan;

    @Size(max = 150)
    private String location;

    private Boolean active;
}
