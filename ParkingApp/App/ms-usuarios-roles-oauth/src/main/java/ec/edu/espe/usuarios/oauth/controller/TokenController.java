package ec.edu.espe.usuarios.oauth.controller;

import ec.edu.espe.usuarios.oauth.dto.TokenRequest;
import ec.edu.espe.usuarios.oauth.dto.TokenResponse;
import ec.edu.espe.usuarios.oauth.service.TokenBlacklistService;
import ec.edu.espe.usuarios.oauth.service.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/oauth/token")
public class TokenController {

    private final TokenService tokenService;
    private final TokenBlacklistService blacklistService;

    public TokenController(TokenService tokenService, TokenBlacklistService blacklistService) {
        this.tokenService = tokenService;
        this.blacklistService = blacklistService;
    }

    /**
     * Genera un JWT firmado. Lo llama internamente el microservicio de Usuarios.
     * POST http://localhost:9000/api/token/generate
     */
    @PostMapping("/generate")
    public ResponseEntity<TokenResponse> generate(@RequestBody TokenRequest request) {
        String token = tokenService.generate(request.getUsername(), request.getTenantId(), request.getRoles());
        return ResponseEntity.ok(
            new TokenResponse(token, "Bearer", tokenService.getExpirySeconds())
        );
    }

    /**
     * Revoca un token (logout). Lo llama el microservicio de Usuarios.
     * POST http://localhost:9000/api/token/revoke
     * Body: { "token": "eyJraWQi..." }
     */
    @PostMapping("/revoke")
    public ResponseEntity<Map<String, String>> revoke(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "token requerido"));
        }
        blacklistService.revoke(token);
        return ResponseEntity.ok(Map.of("message", "Token revocado correctamente"));
    }

    /**
     * Verifica si un token está en la blacklist.
     * Lo consultan los Resource Servers antes de procesar cada request.
     * POST http://localhost:9000/api/token/validate
     * Body: { "token": "eyJraWQi..." }
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        boolean revoked = token != null && blacklistService.isRevoked(token);
        return ResponseEntity.ok(Map.of("revoked", revoked));
    }
}
