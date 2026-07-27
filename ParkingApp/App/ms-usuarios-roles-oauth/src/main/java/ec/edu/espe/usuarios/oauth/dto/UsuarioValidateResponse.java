package ec.edu.espe.usuarios.oauth.dto;

import lombok.Data;
import java.util.List;

@Data
public class UsuarioValidateResponse {
    private boolean valid;
    private String username;
    private List<String> roles;
    private String message;
}
