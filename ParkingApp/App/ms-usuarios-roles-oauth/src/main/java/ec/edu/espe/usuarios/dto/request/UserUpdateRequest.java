package ec.edu.espe.usuarios.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @Size(max = 50, message = "Tenant ID must be at most 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]*$", message = "Tenant ID must contain only letters, numbers, dots, underscores and hyphens")
    private String tenantId;

    @Size(max = 20, message = "Username must be at most 20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username must contain only letters, numbers, dots, underscores and hyphens")
    private String username;

    private Boolean active;

    @Size(max = 25, message = "Firstname must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z]*$", message = "Firstname must contain only letters")
    private String firstName;

    @Size(max = 25, message = "Middle name must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z]*$", message = "Middle name must contain only letters")
    private String middleName;

    @Size(max = 25, message = "Lastname must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z]*$", message = "Lastname must contain only letters")
    private String lastName;

    @Size(max = 25, message = "Email must be at most 25 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]*\\.[a-zA-Z]{2,}$|^$", message = "Email must be a valid email address")
    private String email;

    @Pattern(regexp = "^[0-9]*$", message = "Phone must contain only digits")
    private String phone;

    private String address;
    private String nationality;
}
