package com.example.zonas.controller;

import com.example.zonas.audit.AuditEventPublisher;
import com.example.zonas.audit.AuditRequestUtils;
import com.example.zonas.dto.request.EspacioRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.services.EspacioSseService;
import com.example.zonas.services.interfaz.EspacioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/espacios")
@RequiredArgsConstructor
public class EspacioController {

    private final EspacioService espacioService;
    private final AuditEventPublisher auditEventPublisher;
    private final EspacioSseService espacioSseService;

    @GetMapping
    public ResponseEntity<List<EspacioResponseDto>> listarEspacios(HttpServletRequest request) {
        return ResponseEntity.ok(espacioService.obtenerEspacios(AuditRequestUtils.extractTenantScope(request)));
    }

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter suscribirseASse(HttpServletRequest request) {
        return espacioSseService.subscribe(AuditRequestUtils.extractTenantId(request));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<EspacioResponseDto>> obtenerDisponiblesPorZona(@RequestParam String zona,
                                                                              HttpServletRequest request) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosDisponiblesPorNombreZona(zona, AuditRequestUtils.extractTenantScope(request)));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<EspacioResponseDto>> obtenerPorEstado(@PathVariable String estado,
                                                                     HttpServletRequest request) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosPorEstado(estado, AuditRequestUtils.extractTenantScope(request)));
    }

    @GetMapping("/zona/{idZona}")
    public ResponseEntity<List<EspacioResponseDto>> obtenerPorZona(@PathVariable UUID idZona,
                                                                   HttpServletRequest request) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosPorZona(idZona, AuditRequestUtils.extractTenantScope(request)));
    }

    @GetMapping("/zona/{idZona}/estado/{estado}")
    public ResponseEntity<List<EspacioResponseDto>> obtenerPorZonaYEstado(@PathVariable UUID idZona,
                                                                        @PathVariable String estado,
                                                                        HttpServletRequest request) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosPorZonaEstado(idZona, estado, AuditRequestUtils.extractTenantScope(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EspacioResponseDto> obtenerEspacioPorId(@PathVariable UUID id,
                                                                  HttpServletRequest request) {
        return ResponseEntity.ok(espacioService.obtenerEspacioPorId(id, AuditRequestUtils.extractTenantScope(request)));
    }

    @PostMapping
    public ResponseEntity<EspacioResponseDto> crearEspacio(@Valid @RequestBody EspacioRequestDto requestDto,
                                                            HttpServletRequest request) {
        rejectSuperAdminMutation();
        EspacioResponseDto response = espacioService.crearEspacio(requestDto, AuditRequestUtils.extractWritableTenantId(request));
        auditEventPublisher.publish(request, "ESPACIO", "CREATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "zonaId", response.getIdZona()
        ), "audit.espacio.create");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EspacioResponseDto> actualizarEspacio(@PathVariable UUID id,
                                                               @Valid @RequestBody EspacioRequestDto requestDto,
                                                               HttpServletRequest request) {
        rejectSuperAdminMutation();
        EspacioResponseDto response = espacioService.actualizarEspacio(id, requestDto, AuditRequestUtils.extractTenantScope(request));
        auditEventPublisher.publish(request, "ESPACIO", "UPDATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "zonaId", response.getIdZona(),
                "estado", response.getEstado()
        ), "audit.espacio.update");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEspacio(@PathVariable UUID id,
                                                HttpServletRequest request) {
        rejectSuperAdminMutation();
        auditEventPublisher.publish(request, "ESPACIO", "DELETE", Map.of("id", id.toString()), "audit.espacio.delete");
        espacioService.eliminarEspacio(id, AuditRequestUtils.extractTenantScope(request));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<EspacioResponseDto> cambiarEstado(@PathVariable UUID id,
                                                            @RequestParam EstadoEspacio estado,
                                                            HttpServletRequest request) {
        rejectSuperAdminMutation();
        EspacioResponseDto response = espacioService.cambiarEstado(id, estado, AuditRequestUtils.extractTenantScope(request));
        auditEventPublisher.publish(request, "ESPACIO", "UPDATE", Map.of(
                "id", response.getId(),
                "estado", response.getEstado()
        ), "audit.espacio.update");
        return ResponseEntity.ok(response);
    }

    private void rejectSuperAdminMutation() {
        if (AuditRequestUtils.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN solo puede consultar espacios de empresas, no modificarlos");
        }
    }
}
