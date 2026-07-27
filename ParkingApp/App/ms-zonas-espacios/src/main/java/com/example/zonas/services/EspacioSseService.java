package com.example.zonas.services;

import com.example.zonas.dto.response.EspacioResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class EspacioSseService {

    private final Map<String, List<SseEmitter>> emittersByTenant = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String tenantId) {
        String normalizedTenantId = normalizeTenantId(tenantId);
        SseEmitter emitter = new SseEmitter(0L); // sin timeout
        emittersByTenant.computeIfAbsent(normalizedTenantId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(normalizedTenantId, emitter));
        emitter.onTimeout(() -> removeEmitter(normalizedTenantId, emitter));
        emitter.onError((e) -> removeEmitter(normalizedTenantId, emitter));

        return emitter;
    }

    public void emitirCambioEstado(EspacioResponseDto espacio) {
        String tenantId = normalizeTenantId(espacio.getTenantId());
        emittersByTenant.getOrDefault(tenantId, List.of()).forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("cambio-espacio")
                        .data(espacio));
            } catch (IOException e) {
                log.warn("Error enviando evento SSE, removiendo emitter", e);
                removeEmitter(tenantId, emitter);
            }
        });
    }

    private void removeEmitter(String tenantId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersByTenant.get(tenantId);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByTenant.remove(tenantId);
        }
    }

    private String normalizeTenantId(String tenantId) {
        return tenantId == null || tenantId.isBlank() ? "default" : tenantId.trim();
    }
}
