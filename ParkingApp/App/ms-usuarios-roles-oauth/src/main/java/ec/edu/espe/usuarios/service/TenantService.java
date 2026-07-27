package ec.edu.espe.usuarios.service;

import ec.edu.espe.usuarios.dto.request.TenantRequest;
import ec.edu.espe.usuarios.dto.response.TenantResponse;
import ec.edu.espe.usuarios.entity.Tenant;
import ec.edu.espe.usuarios.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantService {
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<TenantResponse> findAll() {
        return tenantRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TenantResponse findById(String id) {
        return toResponse(getTenant(id));
    }

    @Transactional
    public TenantResponse create(TenantRequest request) {
        String id = normalizeTenantId(request.getId());
        if (tenantRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tenant ya existe: " + id);
        }

        Tenant tenant = Tenant.builder()
                .id(id)
                .name(request.getName())
                .plan(request.getPlan())
                .location(request.getLocation())
                .active(request.getActive() == null || request.getActive())
                .build();
        return toResponse(tenantRepository.save(tenant));
    }

    @Transactional
    public TenantResponse update(String id, TenantRequest request) {
        Tenant tenant = getTenant(id);
        tenant.setName(request.getName());
        tenant.setPlan(request.getPlan());
        tenant.setLocation(request.getLocation());
        if (request.getActive() != null) tenant.setActive(request.getActive());
        return toResponse(tenantRepository.save(tenant));
    }

    @Transactional
    public void delete(String id) {
        Tenant tenant = getTenant(id);
        tenantRepository.delete(tenant);
    }

    private Tenant getTenant(String id) {
        return tenantRepository.findById(normalizeTenantId(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant no encontrado: " + id));
    }

    private TenantResponse toResponse(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .plan(tenant.getPlan())
                .location(tenant.getLocation())
                .active(tenant.getActive())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }

    private String normalizeTenantId(String tenantId) {
        return tenantId == null || tenantId.isBlank() ? "default" : tenantId.trim();
    }
}
