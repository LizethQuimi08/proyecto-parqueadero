package ec.edu.espe.usuarios.oauth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioValidateRequest {
    private String username;
    private String password;
}
