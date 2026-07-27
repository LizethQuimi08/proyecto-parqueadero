package ec.edu.espe.usuarios.config;

import ec.edu.espe.usuarios.entity.Person;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.Tenant;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.entity.UserRoleId;
import ec.edu.espe.usuarios.repository.PersonRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.TenantRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedTenants();
        seedRoles();
        seedAdminUser();
        seedGlobalAdminUser();
        seedTenantUser("empresa1", "admin_empresa1", "1234567891", "admin.e1@test.com", "0000000001", "ADMIN");
        seedTenantUser("empresa2", "admin_empresa2", "1234567892", "admin.e2@test.com", "0000000002", "ADMIN");
        seedTenantUser("empresa1", "user_empresa1", "2234567891", "user.e1@test.com", "0000000011", "USER");
        seedTenantUser("empresa2", "user_empresa2", "2234567892", "user.e2@test.com", "0000000012", "USER");
    }

    private void seedTenants() {
        seedTenant("global", "Parking SaaS Global", "Administracion general", "Consola central multitenant");
        seedTenant("empresa1", "Park Empresa 1", "Operacion empresarial", "Campus norte - acceso principal");
        seedTenant("empresa2", "Park Empresa 2", "Operacion corporativa", "Campus sur - zona administrativa");
    }

    private void seedTenant(String id, String name, String plan, String location) {
        if (tenantRepository.existsById(id)) {
            return;
        }
        tenantRepository.save(Tenant.builder()
                .id(id)
                .name(name)
                .plan(plan)
                .location(location)
                .active(true)
                .build());
        log.info("Tenant {} creado por defecto", id);
    }

    private void seedRoles() {
        if (roleRepository.findByName("SUPER_ADMIN").isEmpty()) {
            Role superAdminRole = Role.builder()
                    .name("SUPER_ADMIN")
                    .description("Administrador general SaaS con acceso a todos los tenants")
                    .build();
            roleRepository.save(superAdminRole);
            log.info("Rol SUPER_ADMIN creado por defecto");
        }

        if (roleRepository.findByName("ADMIN").isEmpty()) {
            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("Administrador de empresa con acceso limitado a su tenant")
                    .build();
            roleRepository.save(adminRole);
            log.info("Rol ADMIN creado por defecto");
        }

        if (roleRepository.findByName("USER").isEmpty()) {
            Role userRole = Role.builder()
                    .name("USER")
                    .description("Usuario estandar del sistema")
                    .build();
            roleRepository.save(userRole);
            log.info("Rol USER creado por defecto");
        }
    }

    private void seedAdminUser() {
        if (userRepository.existsByUsername("admin")) {
            log.info("Usuario admin ya existe, se omite la creacion");
            return;
        }

        if (personRepository.existsByDni("1234567890")) {
            log.info("Persona con DNI 1234567890 ya existe, se omite la creacion del admin");
            return;
        }

        Person person = Person.builder()
                .dni("1234567890")
                .firstName("Admin")
                .lastName("System")
                .email("admin@parqueadero.com")
                .phone("0000000000")
                .nationality("Ecuatoriana")
                .build();
        person = personRepository.save(person);

        User user = User.builder()
                .id(person.getId())
                .person(person)
                .username("admin")
                .passwordHash("1234567890")
                .build();
        user = userRepository.save(user);

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rol ADMIN no encontrado despues de crearlo"));

        UserRoleId userRoleId = new UserRoleId(user.getId(), adminRole.getId());
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(adminRole)
                .build();
        userRoleRepository.save(userRole);

        log.info("Usuario admin creado: username='admin', password='1234567890'");
    }

    private void seedGlobalAdminUser() {
        if (userRepository.existsByUsername("super_admin")) {
            log.info("Usuario super_admin ya existe, se omite la creacion");
            return;
        }

        if (personRepository.existsByDni("9999999999")) {
            log.info("Persona con DNI 9999999999 ya existe, se omite la creacion de super_admin");
            return;
        }

        Person person = Person.builder()
                .dni("9999999999")
                .firstName("Admin")
                .lastName("Global")
                .email("super@test.com")
                .phone("0999999999")
                .nationality("Ecuatoriana")
                .build();
        person = personRepository.save(person);

        User user = User.builder()
                .id(person.getId())
                .person(person)
                .username("super_admin")
                .passwordHash("1234567890")
                .tenantId("global")
                .build();
        user = userRepository.save(user);

        Role role = roleRepository.findByName("SUPER_ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rol SUPER_ADMIN no encontrado despues de crearlo"));

        UserRoleId userRoleId = new UserRoleId(user.getId(), role.getId());
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .build();
        userRoleRepository.save(userRole);

        log.info("Usuario SUPER_ADMIN creado: username='super_admin', password='1234567890'");
    }

    private void seedTenantUser(String tenantId, String username, String dni, String email, String phone, String roleName) {
        if (userRepository.existsByUsername(username)) {
            log.info("Usuario {} ya existe, se omite la creacion", username);
            return;
        }

        if (personRepository.existsByDni(dni)) {
            log.info("Persona con DNI {} ya existe, se omite la creacion de {}", dni, username);
            return;
        }

        Person person = Person.builder()
                .dni(dni)
                .firstName(roleName.equals("ADMIN") ? "Admin" : "Usuario")
                .lastName(tenantId)
                .email(email)
                .phone(phone)
                .nationality("Ecuatoriana")
                .build();
        person = personRepository.save(person);

        User user = User.builder()
                .id(person.getId())
                .person(person)
                .username(username)
                .passwordHash("1234567890")
                .tenantId(tenantId)
                .build();
        user = userRepository.save(user);

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Rol " + roleName + " no encontrado despues de crearlo"));

        UserRoleId userRoleId = new UserRoleId(user.getId(), role.getId());
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .build();
        userRoleRepository.save(userRole);

        log.info("Usuario {} creado para tenant {}: username='{}', password='1234567890'", roleName, tenantId, username);
    }
}
