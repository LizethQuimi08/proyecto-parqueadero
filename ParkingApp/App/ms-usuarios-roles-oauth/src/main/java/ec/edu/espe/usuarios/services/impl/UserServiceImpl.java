package ec.edu.espe.usuarios.services.impl;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.request.UserUpdateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.entity.Person;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.entity.UserRoleId;
import ec.edu.espe.usuarios.repository.PersonRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import ec.edu.espe.usuarios.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Override
    public UserResponse createUser(UserCreateRequest userRequest) {
        if (personRepository.existsByEmail(userRequest.getEmail()))
            throw new IllegalArgumentException("El correo ya esta registrado");
        if (personRepository.existsByDni(userRequest.getDni()))
            throw new IllegalArgumentException("El DNI ya esta registrado");

        Person person = Person.builder()
                .dni(userRequest.getDni())
                .firstName(userRequest.getFirstName())
                .middleName(userRequest.getMiddleName())
                .lastName(userRequest.getLastName())
                .email(userRequest.getEmail())
                .phone(userRequest.getPhone())
                .address(userRequest.getAddress())
                .nationality(userRequest.getNationality())
                .build();

        person = personRepository.save(person);

        User user = User.builder()
                .id(person.getId())
                .person(person)
                .username(generateUsername(userRequest.getFirstName(), userRequest.getMiddleName(), userRequest.getLastName()))
                .tenantId(normalizeTenantId(userRequest.getTenantId()))
                .passwordHash(userRequest.getDni())
                .build();

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse createUserForTenant(UserCreateRequest userRequest, String tenantId, boolean superAdmin) {
        if (!superAdmin) {
            userRequest.setTenantId(normalizeTenantId(tenantId));
        } else if (userRequest.getTenantId() == null || userRequest.getTenantId().isBlank()) {
            userRequest.setTenantId("default");
        }
        return createUser(userRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepository.findAllWithPerson().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersForTenant(String tenantId, boolean superAdmin) {
        return userRepository.findAllWithPerson().stream()
                .filter(user -> superAdmin || normalizeTenantId(user.getTenantId()).equals(normalizeTenantId(tenantId)))
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByIdForTenant(UUID id, String tenantId, boolean superAdmin) {
        User user = getUserEntityForTenant(id, tenantId, superAdmin);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserForTenant(UUID id, UserUpdateRequest request, String tenantId, boolean superAdmin) {
        User user = getUserEntityForTenant(id, tenantId, superAdmin);
        Person person = user.getPerson();

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El username ya esta registrado");
            }
            user.setUsername(request.getUsername());
        }

        if (superAdmin && request.getTenantId() != null && !request.getTenantId().isBlank()) {
            user.setTenantId(normalizeTenantId(request.getTenantId()));
        } else if (!superAdmin) {
            user.setTenantId(normalizeTenantId(tenantId));
        }

        if (request.getActive() != null) user.setActive(request.getActive());
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) person.setFirstName(request.getFirstName());
        if (request.getMiddleName() != null) person.setMiddleName(request.getMiddleName().isBlank() ? null : request.getMiddleName());
        if (request.getLastName() != null && !request.getLastName().isBlank()) person.setLastName(request.getLastName());
        if (request.getEmail() != null && !request.getEmail().isBlank() && !request.getEmail().equals(person.getEmail())) {
            if (personRepository.existsByEmail(request.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado");
            }
            person.setEmail(request.getEmail());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) person.setPhone(request.getPhone());
        if (request.getAddress() != null) person.setAddress(request.getAddress());
        if (request.getNationality() != null && !request.getNationality().isBlank()) person.setNationality(request.getNationality());

        personRepository.save(person);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUserForTenant(UUID id, String tenantId, boolean superAdmin) {
        User user = getUserEntityForTenant(id, tenantId, superAdmin);
        userRoleRepository.deleteAll(userRoleRepository.findByUserId(id));
        userRepository.delete(user);
        personRepository.delete(user.getPerson());
    }

    @Override
    @Transactional(readOnly = true)
    public PersonResponse getPersonByDni(String dni) {
        Person person = personRepository.findByDni(dni)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada con DNI: " + dni));
        return mapToPersonResponse(person);
    }

    @Override
    @Transactional
    public UserResponse assigneRole(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));

        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El rol ya esta asignado al usuario");

        UserRoleId userRoleId = new UserRoleId(userId, roleId);

        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .build();

        userRoleRepository.save(userRole);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse assigneRoleForTenant(UUID userId, UUID roleId, String tenantId, boolean superAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));

        if (!superAdmin && !normalizeTenantId(user.getTenantId()).equals(normalizeTenantId(tenantId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puede gestionar usuarios de otro tenant");
        }

        if (!superAdmin && "SUPER_ADMIN".equals(role.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el administrador general puede asignar SUPER_ADMIN");
        }

        return assigneRole(userId, roleId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String generateUsername(String firstName, String middleName, String lastName) {
        StringBuilder base = new StringBuilder();
        if (firstName != null && !firstName.isBlank()) base.append(firstName.substring(0, 1).toLowerCase());
        if (middleName != null && !middleName.isBlank()) base.append(middleName.substring(0, 1).toLowerCase());
        if (lastName != null && !lastName.isBlank()) base.append(lastName.toLowerCase());

        String baseUsername = base.toString();
        String username = baseUsername;
        int counter = 1;

        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }

        return username;
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .tenantId(user.getTenantId())
                .active(user.getActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .person(mapToPersonResponse(user.getPerson()))
                .build();
    }

    private String normalizeTenantId(String tenantId) {
        return tenantId == null || tenantId.isBlank() ? "default" : tenantId.trim();
    }

    private User getUserEntityForTenant(UUID id, String tenantId, boolean superAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (!superAdmin && !normalizeTenantId(user.getTenantId()).equals(normalizeTenantId(tenantId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puede gestionar usuarios de otro tenant");
        }
        return user;
    }

    private PersonResponse mapToPersonResponse(Person person) {
        if (person == null) return null;
        return PersonResponse.builder()
                .id(person.getId())
                .dni(person.getDni())
                .firstName(person.getFirstName())
                .middleName(person.getMiddleName())
                .lastName(person.getLastName())
                .email(person.getEmail())
                .phone(person.getPhone())
                .address(person.getAddress())
                .nationality(person.getNationality())
                .build();
    }
}
