package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.request.UserUpdateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Usuarios", description = "Gestión de usuarios del sistema de parqueadero")
public class UserController {

    @Autowired
    private UserService userService;

    @Operation(summary = "Listar todos los usuarios", description = "Retorna la lista completa de usuarios registrados. Requiere ROLE_USER o ROLE_ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de usuarios retornada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos suficientes")
    })
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getUsersForTenant(getTenantId(jwt), isSuperAdmin(jwt)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getUserByIdForTenant(id, getTenantId(jwt), isSuperAdmin(jwt)));
    }

    @Operation(summary = "Buscar persona por DNI", description = "Retorna los datos de la persona asociada al DNI proporcionado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Persona encontrada"),
            @ApiResponse(responseCode = "404", description = "Persona no encontrada"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @GetMapping("/dni/{dni}")
    public ResponseEntity<PersonResponse> getPersonByDni(
            @Parameter(description = "Número de DNI/cédula de la persona", required = true)
            @PathVariable String dni) {
        return ResponseEntity.ok(userService.getPersonByDni(dni));
    }

    @Operation(summary = "Crear nuevo usuario", description = "Registra un nuevo usuario en el sistema. Requiere ROLE_ADMIN.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Requiere ROLE_ADMIN")
    })
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        UserResponse response = userService.createUserForTenant(request, getTenantId(jwt), isSuperAdmin(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return ResponseEntity.ok(userService.updateUserForTenant(id, request, getTenantId(jwt), isSuperAdmin(jwt)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        userService.deleteUserForTenant(id, getTenantId(jwt), isSuperAdmin(jwt));
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Asignar rol a usuario",
            description = "Asigna un rol existente a un usuario. Requiere ROLE_ADMIN. Formato UUID: 8-4-4-4-12"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rol asignado exitosamente"),
            @ApiResponse(responseCode = "404", description = "Usuario o rol no encontrado"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Requiere ROLE_ADMIN")
    })
    @PostMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<UserResponse> assigneRoleUser(
            @Parameter(description = "UUID del usuario", required = true) @PathVariable UUID userId,
            @Parameter(description = "UUID del rol a asignar", required = true) @PathVariable UUID roleId,
        @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return ResponseEntity.ok(userService.assigneRoleForTenant(userId, roleId, getTenantId(jwt), isSuperAdmin(jwt)));
    }

    private void requireAdmin(Jwt jwt) {
        if (!hasRole(jwt, "ROLE_ADMIN") && !hasRole(jwt, "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requiere ROLE_ADMIN o ROLE_SUPER_ADMIN");
        }
    }

    private boolean isSuperAdmin(Jwt jwt) {
        return hasRole(jwt, "ROLE_SUPER_ADMIN");
    }

    private boolean hasRole(Jwt jwt, String role) {
        return getRoles(jwt).contains(role);
    }

    private List<String> getRoles(Jwt jwt) {
        if (jwt == null) return Collections.emptyList();
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles == null ? Collections.emptyList() : roles;
    }

    private String getTenantId(Jwt jwt) {
        if (jwt == null || jwt.getClaimAsString("tenantId") == null || jwt.getClaimAsString("tenantId").isBlank()) {
            return "default";
        }
        return jwt.getClaimAsString("tenantId");
    }
}
