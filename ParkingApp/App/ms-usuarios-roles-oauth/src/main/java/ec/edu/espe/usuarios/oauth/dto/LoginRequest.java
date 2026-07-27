package ec.edu.espe.usuarios.oauth.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}
