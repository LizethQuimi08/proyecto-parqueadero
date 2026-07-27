# Multitenancy

## Estrategia

Cada empresa se identifica por `tenantId`.

El frontend detecta el tenant desde la URL:

```text
http://localhost:8080/login
http://localhost:8080/global
http://localhost:8080/empresa1
http://localhost:8080/empresa2
```

El login central vive en `/login`. El usuario no selecciona empresa: el backend identifica el `tenantId` desde las credenciales y el frontend redirige al path correspondiente.

El creador/admin general usa `/global`, que es una consola SaaS separada del frontend operativo de cada empresa. Las rutas `/empresa1` y `/empresa2` mantienen la experiencia propia de cada tenant.

## Jerarquia de acceso

| Rol JWT | Alcance |
| --- | --- |
| `ROLE_SUPER_ADMIN` | Administrador general SaaS. Tiene CRUD completo sobre tenants y usuarios. Puede consultar informacion operativa de todas las empresas, pero no modificarla. |
| `ROLE_ADMIN` | Administrador de empresa. Solo puede gestionar usuarios y datos del `tenantId` incluido en su JWT. |
| `ROLE_USER` | Usuario operativo. Solo opera dentro del `tenantId` definido para su cuenta. |

## Permisos del SUPER_ADMIN

El `SUPER_ADMIN` representa al creador o duenio de la plataforma. Su alcance es global y no queda limitado por `empresa1` o `empresa2`.

Puede realizar CRUD completo sobre:

- Empresas/tenants.
- Administradores de empresa.
- Usuarios operativos.
- Configuraciones globales de la plataforma.

Puede consultar en modo lectura:

- Vehiculos.
- Zonas.
- Espacios.
- Tickets.
- Auditoria.

No puede modificar recursos operativos de una empresa, porque esos datos pertenecen al tenant y deben ser gestionados por el `ROLE_ADMIN` de esa empresa.

Regla de seguridad: aunque puede gestionar todos los tenants, cada operacion debe quedar auditada con `usuario`, `tenantId`, accion, entidad, fecha, IP y origen.

## JWT

El microservicio de usuarios valida credenciales y emite un JWT con:

```json
{
  "sub": "usuario",
  "roles": ["ROLE_ADMIN"],
  "tenantId": "empresa1"
}
```

## Cambios implementados

### MS Usuarios/OAuth

- Se agrego `tenantId` a `User`.
- El login central puede recibir solo `username` y `password`.
- Si se envia `tenantId`, el backend rechaza login si el usuario no pertenece al tenant solicitado.
- El JWT incluye el claim `tenantId`.
- La respuesta de login devuelve `tenantId`.
- Se agrego el rol `SUPER_ADMIN` y el usuario de prueba `super_admin`.
- `GET /api/users` filtra por tenant para `ROLE_ADMIN` y `ROLE_USER`; `ROLE_SUPER_ADMIN` ve todos.
- La creacion de usuarios hecha por un admin de empresa fuerza el `tenantId` del JWT.

### MS Vehiculos

- Se agrego `tenantId` a la entidad `Vehiculo`.
- Las consultas CRUD filtran por tenant.
- La placa ahora es unica por combinacion `(tenantId, placa)`.
- Los eventos de auditoria incluyen `tenantId`.

### MS Tickets

- Se agrego `tenantId` a `Ticket`.
- Listados, busquedas y tickets activos filtran por tenant.
- La validacion de ticket activo se hace por `(tenantId, placa)`.
- Los eventos de auditoria incluyen `tenantId`.

### MS Auditoria

- Se agrego `tenantId` a `EventoAuditoria`.
- Las consultas de auditoria filtran por tenant autenticado.
- Los eventos RabbitMQ sin `tenantId` caen en `default` por compatibilidad.

### MS Zonas/Espacios

- Se agrego `tenantId` a `Zona` y `Espacio`.
- Las consultas se filtran por tenant.
- Los cambios de estado por SSE se emiten solo a suscriptores del mismo tenant.

## Valor por defecto

Para compatibilidad local se usa:

```text
tenantId = default
```

En produccion se recomienda reemplazarlo por una entidad formal `Tenant` con migraciones versionadas.
