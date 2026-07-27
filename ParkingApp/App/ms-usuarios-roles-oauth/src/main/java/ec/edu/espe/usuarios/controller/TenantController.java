package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.request.TenantRequest;
import ec.edu.espe.usuarios.dto.response.TenantResponse;
import ec.edu.espe.usuarios.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantService tenantService;

    @GetMapping
    public ResponseEntity<List<TenantResponse>> findAll(@AuthenticationPrincipal Jwt jwt) {
        requireSuperAdmin(jwt);
        return ResponseEntity.ok(tenantService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantResponse> findById(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        requireSuperAdmin(jwt);
        return ResponseEntity.ok(tenantService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TenantResponse> create(@Valid @RequestBody TenantRequest request,
                                                 @AuthenticationPrincipal Jwt jwt) {
        requireSuperAdmin(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TenantResponse> update(@PathVariable String id,
                                                 @Valid @RequestBody TenantRequest request,
                                                 @AuthenticationPrincipal Jwt jwt) {
        requireSuperAdmin(jwt);
        return ResponseEntity.ok(tenantService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        requireSuperAdmin(jwt);
        tenantService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void requireSuperAdmin(Jwt jwt) {
        List<String> roles = jwt == null ? Collections.emptyList() : jwt.getClaimAsStringList("roles");
        if (roles == null || !roles.contains("ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requiere ROLE_SUPER_ADMIN");
        }
    }
}
