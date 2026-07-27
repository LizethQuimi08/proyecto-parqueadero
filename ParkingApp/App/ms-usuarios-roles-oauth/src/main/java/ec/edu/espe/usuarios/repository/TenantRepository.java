package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, String> {
}
