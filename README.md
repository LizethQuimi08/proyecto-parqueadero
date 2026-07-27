 # Sistema de Parqueadero

 Sistema de parqueadero basado en microservicios. La solucion separa la logica de negocio en servicios independientes para autenticacion, usuarios, vehiculos, zonas, espacios, tickets y auditoria. La comunicacion entre servicios se apoya en JWT, HTTP interno, RabbitMQ y un API Gateway con Kong.

 ## Arquitectura general

 La solucion esta compuesta por:

 - Microservicio de usuarios y OAuth para autenticacion, roles y emision de tokens.
 - Microservicio de zonas y espacios para administrar la infraestructura fisica del parqueadero.
 - Microservicio de vehiculos para registrar y consultar vehiculos.
 - Microservicio de tickets para controlar ingresos, salidas y cobros.
 - Microservicio de auditoria para guardar eventos relevantes del sistema.
 - Kong como gateway para centralizar el acceso a las APIs.
 - Base de datos relacional para persistencia de cada servicio segun su implementacion.
 - RabbitMQ para publicacion y consumo de eventos de auditoria.

 ## Estructura del repositorio

 El repositorio principal contiene:

 - [README.md](README.md): documentacion general del proyecto.
 - [ParkingApp/docker-compose.yml](ParkingApp/docker-compose.yml): orquestacion local de los servicios.
 - [ParkingApp/kong.yml](ParkingApp/kong.yml): definicion de rutas del gateway.
 - [ParkingApp/package.json](ParkingApp/package.json): scripts globales.
 - [ParkingApp/pom.xml](ParkingApp/pom.xml): agregador Maven de los modulos Java.
 - [ParkingApp/App/ms-vehiculos](ParkingApp/App/ms-vehiculos): microservicio de vehiculos.
 - [ParkingApp/App/ms-tickets](ParkingApp/App/ms-tickets): microservicio de tickets.
 - [ParkingApp/App/ms-audit](ParkingApp/App/ms-audit): microservicio de auditoria.
 - [ParkingApp/App/ms-zonas-espacios](ParkingApp/App/ms-zonas-espacios): microservicio de zonas y espacios.
 - [ParkingApp/App/ms-usuarios-roles-oauth](ParkingApp/App/ms-usuarios-roles-oauth): microservicio de usuarios, roles y OAuth.

 ## Como funciona el sistema

 El flujo general es el siguiente:

 1. Se registra una persona y se crea su usuario.
 2. Se le asignan uno o mas roles.
 3. El usuario inicia sesion y obtiene un JWT.
 4. Con ese token accede a los demas microservicios.
 5. Se registra un vehiculo.
 6. Se administra una zona y sus espacios.
 7. Se crea un ticket de ingreso validando persona, vehiculo y espacio.
 8. Al cerrar el ticket, el espacio vuelve a quedar disponible.
 9. Los eventos importantes se publican en auditoria.

 ## Microservicio de usuarios y OAuth

 Este bloque esta dividido en dos partes dentro de la carpeta [ParkingApp/App/ms-usuarios-roles-oauth](ParkingApp/App/ms-usuarios-roles-oauth).

 ### Parte 1: gestion de usuarios y roles

 Ubicada en el paquete `ec.edu.espe.usuarios`.

 Este servicio maneja el ciclo de vida de las personas, usuarios y roles del sistema. Su responsabilidad es mantener la identidad y los permisos.

 #### Responsabilidades

 - Registrar personas con sus datos personales.
 - Crear usuarios asociados a una persona.
 - Crear roles.
 - Asignar roles a usuarios.
 - Consultar usuarios y personas por DNI.
 - Manejar autenticacion inicial del usuario.

 #### Composicion interna

 - [UserController](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/controller/UserController.java)
 - [RoleController](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/controller/RoleController.java)
 - [AuthController](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/controller/AuthController.java)
 - [UserServiceImpl](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/services/impl/UserServiceImpl.java)
 - [RoleServiceImpl](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/services/impl/RoleServiceImpl.java)
 - [AuthService](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/service/AuthService.java)

 #### Endpoints principales

 - `GET /api/users`
 - `GET /api/users/dni/{dni}`
 - `POST /api/users`
 - `POST /api/users/{userId}/roles/{roleId}`
 - `GET /api/roles`
 - `POST /api/roles`
 - `POST /api/auth/register`
 - `POST /api/auth/login`
 - `POST /api/auth/logout`

 #### Modelo de datos

 - [Person](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/entity/Person.java): datos personales.
 - [User](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/entity/User.java): credenciales y estado.
 - [Role](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/entity/Role.java): catalogo de roles.
 - [UserRole](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/entity/UserRole.java): relacion entre usuarios y roles.

 #### Flujo de autenticacion

 1. El usuario envía username y password.
 2. El sistema valida las credenciales.
 3. Se consultan los roles asignados.
 4. Si no tiene roles, se asigna un rol estandar por defecto.
 5. Se solicita al servidor OAuth la firma del token.
 6. Se devuelve el JWT al cliente.

 ### Parte 2: servidor OAuth y JWT

 Ubicada en el paquete `ec.edu.espe.usuarios.oauth`.

 Este segundo bloque actua como servidor de autorizacion. Su tarea es generar y revocar tokens firmados con RSA, y exponer las claves publicas para que los demas servicios validen los JWT.

 #### Responsabilidades

 - Generar JWT firmados con RSA-256.
 - Incluir los roles dentro del token.
 - Exponer el JWKS publico.
 - Revocar tokens mediante blacklist en memoria.
 - Soportar el flujo de login y logout.

 #### Composicion interna

 - [TokenController](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/oauth/controller/TokenController.java)
 - [TokenService](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/oauth/service/TokenService.java)
 - [TokenBlacklistService](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/oauth/service/TokenBlacklistService.java)
 - [JwksController](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/oauth/config/JwksController.java)
 - [SecurityConfig](ParkingApp/App/ms-usuarios-roles-oauth/src/main/java/ec/edu/espe/usuarios/oauth/config/SecurityConfig.java)

 #### Endpoints principales

 - `POST /api/oauth/token/generate`
 - `POST /api/oauth/token/revoke`
 - `POST /api/oauth/token/validate`
 - `GET /.well-known/jwks.json`

 ## Microservicio de zonas y espacios

 Ubicado en [ParkingApp/App/ms-zonas-espacios](ParkingApp/App/ms-zonas-espacios).

 Este servicio administra la estructura fisica del parqueadero. Define zonas, sus tipos, capacidad y los espacios asociados.

 ### Responsabilidades

 - Crear y administrar zonas.
 - Crear y administrar espacios dentro de cada zona.
 - Consultar espacios por zona, estado o disponibilidad.
 - Cambiar el estado de un espacio.
 - Validar restricciones de negocio relacionadas con ocupacion y capacidad.

 ### Composicion interna

 - [ZonaController](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/controller/ZonaController.java)
 - [EspacioController](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/controller/EspacioController.java)
 - [ServicesZona](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/services/ServicesZona.java)
 - [ServicesEspacio](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/services/ServicesEspacio.java)
 - [ZonaRepositorio](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/repository/ZonaRepositorio.java)
 - [EspacioRepositorio](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/repository/EspacioRepositorio.java)
 - [MapperUtils](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/utils/MapperUtils.java)

 ### Endpoints principales

 - `GET /api/zonas`
 - `GET /api/zonas/buscar?nombre=...`
 - `POST /api/zonas`
 - `PUT /api/zonas/{id}`
 - `DELETE /api/zonas/{id}`
 - `GET /api/espacios`
 - `GET /api/espacios/disponibles?zona=...`
 - `GET /api/espacios/estado/{estado}`
 - `GET /api/espacios/zona/{idZona}`
 - `GET /api/espacios/zona/{idZona}/estado/{estado}`
 - `POST /api/espacios`
 - `PUT /api/espacios/{id}`
 - `DELETE /api/espacios/{id}`
 - `PATCH /api/espacios/{id}/estado?estado=...`

 ### Modelo de datos

 - [Zona](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/entidades/Zona.java)
 - [Espacio](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/entidades/Espacio.java)
 - [TipoZona](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/entidades/TipoZona.java)
 - [TipoEspacio](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/entidades/TipoEspacio.java)
 - [EstadoEspacio](ParkingApp/App/ms-zonas-espacios/src/main/java/com/example/zonas/entidades/EstadoEspacio.java)

 ### Reglas de negocio

 - Una zona tiene varios espacios.
 - Cada espacio pertenece a una sola zona.
 - No se puede eliminar una zona si tiene espacios ocupados, reservados o en mantenimiento.
 - El estado del espacio se actualiza cuando se crea o se cierra un ticket.
 - Se generan codigos automaticos para zonas y espacios.

 ### Seguridad

 Este servicio valida JWT y permisos mediante OAuth2 Resource Server. Los accesos de lectura requieren autenticacion y las operaciones de creacion, modificacion y eliminacion se restringen a roles administrativos.

 ## Microservicio de vehiculos

 Ubicado en [ParkingApp/App/ms-vehiculos](ParkingApp/App/ms-vehiculos).

 Este servicio gestiona el registro de vehiculos que ingresan o estan autorizados en el parqueadero.

 ### Responsabilidades

 - Registrar vehiculos.
 - Consultar vehiculos por ID o placa.
 - Actualizar vehiculos.
 - Eliminar vehiculos.
 - Publicar eventos de auditoria.
 - Validar acceso por JWT y roles.

 ### Composicion interna

 - [VehiculoController](ParkingApp/App/ms-vehiculos/src/vehiculo/vehiculo.controller.ts)
 - [VehiculosService](ParkingApp/App/ms-vehiculos/src/vehiculo/services/vehiculos.service.ts)
 - [FactoryVehiculos](ParkingApp/App/ms-vehiculos/src/vehiculo/factory/factory-vehiculos.ts)
 - [EventPublisherService](ParkingApp/App/ms-vehiculos/src/common/event-publisher.service.ts)
 - [Vehiculo](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/vehiculo.entity.ts)
 - [Auto](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/auto.entity.ts)
 - [Motocicleta](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/motocicleta.entity.ts)
 - [Camioneta](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/camioneta.entity.ts)

 ### Endpoints principales

 - `GET /vehiculo`
 - `GET /vehiculo/placa/{placa}`
 - `GET /vehiculo/{id}`
 - `POST /vehiculo`
 - `PATCH /vehiculo/{id}`
 - `DELETE /vehiculo/{id}`

 ### Como funciona

 1. El controlador recibe la solicitud de registro.
 2. El servicio valida que la placa no exista.
 3. La fabrica crea la entidad concreta segun el tipo.
 4. Se guarda el vehiculo en la base de datos.
 5. Se publica un evento en RabbitMQ para auditoria.

 ### Modelo de datos

 El servicio usa herencia en TypeORM:

 - [Vehiculo](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/vehiculo.entity.ts): clase base.
 - [Auto](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/auto.entity.ts): subclase para autos.
 - [Motocicleta](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/motocicleta.entity.ts): subclase para motos.
 - [Camioneta](ParkingApp/App/ms-vehiculos/src/vehiculo/entities/camioneta.entity.ts): subclase para camionetas.

 ### Auditoria

 Cada alta de vehiculo intenta publicar un evento con datos relevantes como servicio, accion, entidad, usuario, IP y MAC. Ese evento luego puede ser consumido por el microservicio de auditoria.

 ## Microservicio de tickets

 Ubicado en [ParkingApp/App/ms-tickets](ParkingApp/App/ms-tickets).

 Es el servicio que coordina el proceso operativo del parqueadero. Aqui se registra la entrada y salida de vehiculos, y se calcula el valor a cobrar.

 ### Responsabilidades

 - Crear tickets de ingreso.
 - Validar persona, vehiculo y espacio.
 - Consultar tickets activos.
 - Cerrar tickets.
 - Calcular cobros segun tiempo de permanencia.
 - Actualizar el estado del espacio relacionado.

 ### Composicion interna

 - [TicketsController](ParkingApp/App/ms-tickets/src/tickets/tickets.controller.ts)
 - [TicketsService](ParkingApp/App/ms-tickets/src/tickets/tickets.service.ts)
 - [HttpClientService](ParkingApp/App/ms-tickets/src/tickets/common/http-client.service.ts)
 - [Ticket](ParkingApp/App/ms-tickets/src/tickets/entities/ticket.entity.ts)
 - [AuthModule](ParkingApp/App/ms-tickets/src/auth/auth.module.ts)
 - [JwtStrategy](ParkingApp/App/ms-tickets/src/auth/jwt.strategy.ts)
 - [RolesGuard](ParkingApp/App/ms-tickets/src/auth/roles.guard.ts)

 ### Endpoints principales

 - `POST /tickets`
 - `GET /tickets`
 - `GET /tickets/activos`
 - `GET /tickets/{id}`
 - `PATCH /tickets/{id}`
 - `DELETE /tickets/{id}`

 ### Flujo de creacion de ticket

 1. Se valida que la persona exista en el microservicio de usuarios.
 2. Se valida que el vehiculo exista en el microservicio de vehiculos.
 3. Se verifica que el espacio este disponible en el microservicio de zonas y espacios.
 4. Se comprueba que no exista otro ticket activo para la misma placa.
 5. Se guarda el ticket en la base de datos.
 6. Se marca el espacio como ocupado.

 ### Flujo de cierre de ticket

 1. Se busca el ticket por ID.
 2. Se calcula el tiempo transcurrido.
 3. Se calcula el valor a cobrar.
 4. Se marca el ticket como cerrado.
 5. Se actualiza la fecha de salida.
 6. Se libera el espacio.

 ### Modelo de datos

 - [Ticket](ParkingApp/App/ms-tickets/src/tickets/entities/ticket.entity.ts)

 Campos principales:

 - placa
 - dni
 - idEspacio
 - nombreZona
 - fechaHoraIngreso
 - fechaHoraSalida
 - activo
 - valorRecaudado

 ### Integracion entre servicios

 Este servicio consume otros microservicios mediante HTTP interno:

 - Usuarios para validar DNI.
 - Vehiculos para validar placa.
 - Zonas y espacios para verificar disponibilidad y cambiar estado.

 ## Microservicio de auditoria

 Ubicado en [ParkingApp/App/ms-audit](ParkingApp/App/ms-audit).

 Este servicio registra eventos importantes del sistema y permite consultarlos posteriormente.

 ### Responsabilidades

 - Consumir eventos desde RabbitMQ.
 - Validar el contenido de cada mensaje.
 - Persistir eventos de auditoria.
 - Exponer endpoints de consulta.
 - Proteger el endpoint con limitacion de tasa.

 ### Composicion interna

 - [AuditConsumer](ParkingApp/App/ms-audit/src/audit/audit.consumer.ts)
 - [AuditService](ParkingApp/App/ms-audit/src/audit/audit.service.ts)
 - [AuditController](ParkingApp/App/ms-audit/src/audit/audit.controller.ts)
 - [EventoAuditoria](ParkingApp/App/ms-audit/src/audit/entities/evento-auditoria.entity.ts)

 ### Endpoints principales

 - `POST /api/audit`
 - `GET /api/audit`
 - `GET /api/audit/{id}`
 - `PATCH /api/audit/{id}`
 - `DELETE /api/audit/{id}`

 ### Flujo de consumo

 1. El consumidor se conecta a RabbitMQ.
 2. Se suscribe a la cola configurada.
 3. Recibe eventos publicados por otros servicios.
 4. Valida el payload.
 5. Guarda el evento en la base de datos.
 6. Confirma o rechaza el mensaje.

 ## Seguridad del sistema

 El sistema usa JWT con RSA y roles embebidos dentro del token.

 - El microservicio OAuth firma los tokens.
 - Los demas microservicios validan los tokens por JWKS.
 - Los roles viajan como claim `roles`.
 - Kong expone las rutas externas.
 - Los controladores de Nest y Spring aplican proteccion por rol cuando esta habilitada.

 ## Infraestructura local

 La ejecucion local esta definida en [ParkingApp/docker-compose.yml](ParkingApp/docker-compose.yml).

 Servicios contemplados:

 - PostgreSQL
 - Kong
 - ms-usuarios-roles-oauth
 - ms-zonas-espacios
 - ms-vehiculos
 - ms-tickets

 ## Scripts globales

 En [ParkingApp/package.json](ParkingApp/package.json) existen scripts para levantar partes del sistema:

 - `npm run install:all`
 - `npm run start:vehiculos`
 - `npm run start:tickets`
 - `npm run start:java`
 - `npm run docker:up`
 - `npm run docker:down`
 - `npm run docker:build`
 - `npm run docker:logs`

 ## Puertos principales

 - Kong proxy: `8000`
 - Kong admin: `8001`
 - OAuth server: `9000`
 - ms-zonas-espacios: `8081`
 - ms-usuarios-roles-oauth: `8082`
 - ms-vehiculos: `3000`
 - ms-tickets: `3001`

 ## Observaciones tecnicas

 Hay algunos puntos que conviene revisar porque pueden afectar la ejecucion local:

 - [ParkingApp/docker-compose.yml](ParkingApp/docker-compose.yml) usa PostgreSQL, pero [ms-zonas-espacios](ParkingApp/App/ms-zonas-espacios/src/main/resources/application.yaml) esta configurado por defecto para MySQL.
 - El microservicio de vehiculos y el de auditoria dependen de RabbitMQ, pero RabbitMQ no aparece declarado en el compose raiz.
 - Algunas variables de entorno de tickets no coinciden con las que lee [TicketsService](ParkingApp/App/ms-tickets/src/tickets/tickets.service.ts).
 - Varios guards de seguridad estan comentados temporalmente en controladores Nest.
 - En usuarios/OAuth hay dos estructuras Java distintas dentro del mismo modulo, una para negocio y otra para OAuth.

 ## Resumen funcional

 El sistema trabaja asi:

 - Usuarios y roles definen quien puede operar.
 - OAuth entrega y revoca tokens.
 - Vehiculos registra los automotores que usarán el parqueadero.
 - Zonas y espacios representan la disponibilidad fisica.
 - Tickets controlan la entrada, permanencia y salida.
 - Auditoria registra eventos relevantes para trazabilidad.
