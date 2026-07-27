package ec.edu.espe.usuarios.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserCreateRequest {
    @Size(max = 50, message = "Tenant ID must be at most 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]*$", message = "Tenant ID must contain only letters, numbers, dots, underscores and hyphens")
    private String tenantId;

    @NotBlank(message = "DNI is required")
    @Size(max = 10, message = "DNI must be at most 10 characters")
    @Pattern(regexp = "^[0-9]+$", message = "DNI must contain only digits")
    private String dni;
    @NotBlank(message = "Firstname is required")
    @Size(max = 25, message = "Firstname must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "Firstname must contain only letters")
    private String firstName;
    private String middleName;
    @NotBlank(message = "Lastname is required")
    @Size(max = 25, message = "Lastname must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "Lastname must contain only letters")
    private String lastName;
    @NotBlank(message = "Email is required")
    @Size(max = 25, message = "Email must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Email must be a valid email address")
    private String email;
    @Pattern(regexp = "^[0-9]+$", message = "Phone must contain only digits")
    private String phone;
    private String address;
    private String nationality;
}
