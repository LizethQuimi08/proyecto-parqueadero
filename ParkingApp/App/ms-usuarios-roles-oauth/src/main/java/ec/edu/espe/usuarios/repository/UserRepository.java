package ec.edu.espe.usuarios.repository;
import ec.edu.espe.usuarios.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository <User, UUID> {
    boolean existsByUsername(String username);
    Optional<User> findByUsername(String username);
    
    @Query(value = "SELECT * FROM users WHERE LOWER(username) LIKE LOWER(CONCAT('%', :username, '%'))", nativeQuery = true)
    List<User> findByPartialUsername(String username);
    @Query("SELECT u FROM User u JOIN FETCH u.person")
    List<User> findAllWithPerson();
}
