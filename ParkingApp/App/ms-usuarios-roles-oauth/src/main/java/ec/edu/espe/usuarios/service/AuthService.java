package ec.edu.espe.usuarios.service;

import ec.edu.espe.usuarios.dto.request.LoginRequest;
import ec.edu.espe.usuarios.dto.response.LoginResponse;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Value("${oauth.server.url:http://localhost:9000}")
    private String oauthServerUrl;

    /**
     * Flujo de login:
     * 1. Busca el usuario por username
     * 2. Compara la contraseña (el sistema guarda el DNI como contraseña por defecto)
     * 3. Obtiene los roles asignados al usuario
     * 4. Llama al OAuth server para que firme el JWT con esos roles
     * 5. Devuelve el token al cliente (Postman)
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        // 1. Buscar usuario
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos"));

        // 2. Validar contraseña (el sistema usa el DNI como passwordHash por defecto)
        if (!request.getPassword().equals(user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Usuario o contraseña incorrectos");
        }

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Usuario inactivo");
        }

        String requestedTenantId = request.getTenantId();
        if (requestedTenantId != null
                && !requestedTenantId.isBlank()
                && !normalizeTenantId(user.getTenantId()).equals(normalizeTenantId(requestedTenantId))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Usuario no pertenece a la empresa solicitada");
        }

        // 3. Obtener roles del usuario
        List<String> roles = userRoleRepository.findByUserId(user.getId())
                .stream()
                .map(ur -> "ROLE_" + ur.getRole().getName().toUpperCase())
                .collect(Collectors.toList());

        // Si no tiene roles asignados → rol de usuario estándar por defecto
        if (roles.isEmpty()) {
            roles = List.of("ROLE_USER");
        }

        log.info("Login exitoso para usuario: {} con roles: {}", user.getUsername(), roles);

        // 4. Pedir token firmado al OAuth server
        String token = requestTokenFromOAuth(user.getUsername(), user.getTenantId(), roles);

        // 5. Retornar respuesta completa
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(3600)
                .username(user.getUsername())
                .tenantId(user.getTenantId())
                .roles(roles)
                .build();
    }

    /**
     * Logout: extrae el token del header Authorization y lo revoca en el OAuth server.
     */
    public Map<String, String> logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Header Authorization con Bearer token requerido");
        }
        String token = authHeader.substring(7);
        revokeTokenInOAuth(token);
        log.info("Logout exitoso — token revocado");
        return Map.of("message", "Sesión cerrada correctamente");
    }

    private void revokeTokenInOAuth(String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = oauthServerUrl + "/api/oauth/token/revoke";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("token", token), headers);
            restTemplate.postForEntity(url, entity, Map.class);
        } catch (Exception e) {
            log.warn("No se pudo revocar el token en OAuth server: {}", e.getMessage());
        }
    }
    private String requestTokenFromOAuth(String username, String tenantId, List<String> roles) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = oauthServerUrl + "/api/oauth/token/generate";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "username", username,
                    "tenantId", tenantId,
                    "roles", roles
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("accessToken");
            }

            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo obtener el token del servidor OAuth");

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Error al contactar el servidor OAuth: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Servidor OAuth no disponible. Asegúrate de que esté corriendo en " + oauthServerUrl);
        }
    }

    private String normalizeTenantId(String tenantId) {
        return tenantId == null || tenantId.isBlank() ? "default" : tenantId.trim();
    }
}
