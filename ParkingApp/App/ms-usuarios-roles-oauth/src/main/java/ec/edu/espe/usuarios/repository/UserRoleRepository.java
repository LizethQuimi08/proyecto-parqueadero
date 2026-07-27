package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    boolean existsByUserIdAndRoleId(UUID idUser, UUID idRole);

    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role WHERE ur.user.id = :userId")
    List<UserRole> findByUserId(UUID userId);
}
