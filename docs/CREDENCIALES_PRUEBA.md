# Credenciales de prueba

Estas credenciales son para validar el frontend dockerizado y el backend desplegado localmente.

## URL de ingreso

El ingreso se hace desde:

```text
http://localhost:8080/login
```

En el login no se selecciona empresa. El backend identifica el `tenantId` a partir del usuario autenticado y el frontend redirige automaticamente a:

| Empresa | URL posterior al login |
| --- | --- |
| Administracion global | `http://localhost:8080/global` |
| Empresa 1 | `http://localhost:8080/empresa1` |
| Empresa 2 | `http://localhost:8080/empresa2` |

`/global` es el frontend del creador/admin general de la plataforma. No corresponde a una empresa de parqueadero; muestra administracion SaaS y acceso a tenants.

## Administrador general

| Tenant | Usuario | Contrasena | Rol esperado |
| --- | --- | --- | --- |
| `global` | `![alt text](image.png)` | `1234567890` | `SUPER_ADMIN` |

El administrador general puede consultar informacion de todos los tenants y acceder a modulos administrativos.

Alcance esperado del `super_admin`:

| Modulo | Permiso |
| --- | --- |
| Empresas/Tenants | CRUD completo |
| Usuarios | CRUD completo global |
| Administradores de empresa | CRUD completo global |
| Vehiculos | Solo lectura global |
| Zonas | Solo lectura global |
| Espacios | Solo lectura global |
| Tickets | Solo lectura global |
| Auditoria | Solo lectura global |

El `super_admin` no modifica datos operativos de una empresa. Esa responsabilidad queda para el `ADMIN` de cada tenant.

## Administradores de empresa

| Tenant | Usuario | Contrasena | Rol esperado |
| --- | --- | --- | --- |
| `empresa1` | `admin_empresa1` | `1234567890` | `ADMIN` |
| `empresa2` | `admin_empresa2` | `1234567890` | `ADMIN` |

Cada administrador de empresa solo gestiona usuarios y datos de su propio `tenantId`.

## Usuarios operativos

| Tenant | Usuario | Contrasena | Rol esperado |
| --- | --- | --- | --- |
| `empresa1` | `user_empresa1` | `1234567890` | `USER` |
| `empresa2` | `user_empresa2` | `1234567890` | `USER` |

## Datos demo por empresa

### Empresa 1

| Modulo | Datos |
| --- | --- |
| Zonas | `NORTE VIP`, `GENERAL A` |
| Espacios | 6 espacios demo con estados `DISPONIBLE`, `OCUPADO`, `RESERVADO`, `MANTENIMIENTO` |
| Vehiculos | `EAA-1001`, `EAM-1002` |

### Empresa 2

| Modulo | Datos |
| --- | --- |
| Zonas | `SUR ADMIN`, `ESTUDIANTES B` |
| Espacios | 6 espacios demo con estados `DISPONIBLE`, `OCUPADO`, `RESERVADO`, `MANTENIMIENTO` |
| Vehiculos | `EBB-2001`, `EBC-2002` |

Validacion esperada:

- `admin_empresa1` solo ve los datos de `empresa1`.
- `admin_empresa2` solo ve los datos de `empresa2`.
- El admin de empresa puede crear, actualizar y eliminar recursos dentro de su propio tenant.
- Un admin de empresa no puede ver ni modificar datos de otro tenant.

## Notas de login

- El frontend solo solicita `usuario` y `contrasena`.
- El `tenantId` no se selecciona en pantalla; lo devuelve el backend segun el usuario autenticado.
- El rol no se selecciona en pantalla; llega en el JWT/respuesta del login.
- El panel de auditoria se muestra solo cuando el token contiene `ROLE_ADMIN` o `ROLE_SUPER_ADMIN`.
- Los usuarios `USER` no deben ver el modulo de auditoria.
- Los administradores `ADMIN` no deben ver usuarios ni datos de otras empresas.
- Si la base de datos ya estaba creada, reinicia el microservicio `ms-usuarios-roles-oauth` para que ejecute el seeder y cree los usuarios faltantes.

## Endpoint usado por el frontend

```http
POST http://localhost:30080/api/auth/login
Content-Type: application/json

{
  "username": "admin_empresa1",
  "password": "1234567890"
}
```
