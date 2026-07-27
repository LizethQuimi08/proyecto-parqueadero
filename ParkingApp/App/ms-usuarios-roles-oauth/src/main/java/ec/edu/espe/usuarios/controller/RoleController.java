package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.request.RoleCreateRequest;
import ec.edu.espe.usuarios.dto.response.RoleResponse;
import ec.edu.espe.usuarios.services.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@Tag(name = "Roles", description = "Gestión de roles de usuario. Requiere ROLE_ADMIN.")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @Operation(summary = "Listar todos los roles", description = "Retorna todos los roles disponibles en el sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de roles retornada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Requiere ROLE_ADMIN")
    })
    @GetMapping
    public ResponseEntity<List<RoleResponse>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @Operation(summary = "Crear nuevo rol", description = "Registra un nuevo rol en el sistema.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Rol creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Requiere ROLE_ADMIN")
    })
    @PostMapping
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody RoleCreateRequest request) {
        RoleResponse response = roleService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
