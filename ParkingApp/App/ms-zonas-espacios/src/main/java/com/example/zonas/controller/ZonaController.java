package com.example.zonas.controller;

import com.example.zonas.audit.AuditEventPublisher;
import com.example.zonas.audit.AuditRequestUtils;
import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.services.interfaz.ZonaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/zonas")
@RequiredArgsConstructor
public class ZonaController {

    private final ZonaService zonaService;
    private final AuditEventPublisher auditEventPublisher;

    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas(HttpServletRequest request) {
        return ResponseEntity.ok(zonaService.listarZonas(AuditRequestUtils.extractTenantScope(request)));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ZonaResponseDto>> buscarZonas(@RequestParam String nombre,
                                                             HttpServletRequest request) {
        return ResponseEntity.ok(zonaService.buscarZonas(nombre, AuditRequestUtils.extractTenantScope(request)));
    }

    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(@Valid @RequestBody ZonaRequestDto requestDto,
                                                      HttpServletRequest request) {
        rejectSuperAdminMutation();
        ZonaResponseDto response = zonaService.crearZona(requestDto, AuditRequestUtils.extractWritableTenantId(request));
        auditEventPublisher.publish(request, "ZONA", "CREATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "tipo", response.getTipo(),
                "codigo", response.getCodigo()
        ), "audit.zona.create");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(
        @PathVariable UUID id,
        @Valid @RequestBody ZonaRequestDto requestDto,
        HttpServletRequest request) {
        rejectSuperAdminMutation();
        ZonaResponseDto response = zonaService.actualizarZona(id, requestDto, AuditRequestUtils.extractTenantScope(request));
        auditEventPublisher.publish(request, "ZONA", "UPDATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "tipo", response.getTipo(),
                "codigo", response.getCodigo()
        ), "audit.zona.update");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarZona(@PathVariable UUID id,
                                             HttpServletRequest request) {
        rejectSuperAdminMutation();
        auditEventPublisher.publish(request, "ZONA", "DELETE", Map.of("id", id.toString()), "audit.zona.delete");
        zonaService.eliminarZona(id, AuditRequestUtils.extractTenantScope(request));
        return ResponseEntity.noContent().build();
    }

    private void rejectSuperAdminMutation() {
        if (AuditRequestUtils.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN solo puede consultar zonas de empresas, no modificarlas");
        }
    }
}
