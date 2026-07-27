package ec.edu.espe.usuarios.services;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.request.UserUpdateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.entity.User;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse createUser(UserCreateRequest userRequest);

    UserResponse createUserForTenant(UserCreateRequest userRequest, String tenantId, boolean superAdmin);

    List<UserResponse> getUsers();

    List<UserResponse> getUsersForTenant(String tenantId, boolean superAdmin);

    UserResponse getUserById(UUID id);

    UserResponse getUserByIdForTenant(UUID id, String tenantId, boolean superAdmin);

    UserResponse updateUserForTenant(UUID id, UserUpdateRequest request, String tenantId, boolean superAdmin);

    void deleteUserForTenant(UUID id, String tenantId, boolean superAdmin);

    UserResponse assigneRole(UUID userId, UUID roleId);

    UserResponse assigneRoleForTenant(UUID userId, UUID roleId, String tenantId, boolean superAdmin);

    PersonResponse getPersonByDni(String dni);
}
