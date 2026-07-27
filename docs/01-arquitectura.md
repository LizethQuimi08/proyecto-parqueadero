# Arquitectura

## Estructura del monorepo

```text
Backend/Monitoreo
  Frontend web dockerizado

ParkingApp/App/ms-usuarios-roles-oauth
  Usuarios, roles, login, OAuth/JWT y tenant

ParkingApp/App/ms-vehiculos
  Gestion de vehiculos

ParkingApp/App/ms-zonas-espacios
  Gestion de zonas, espacios y SSE

ParkingApp/App/ms-tickets
  Gestion de tickets de parqueo

ParkingApp/App/ms-audit
  Auditoria centralizada

ParkingApp/docker
  Dockerfiles wrapper para Kong, RabbitMQ y Postgres

ParkingApp/k8s
  Manifiestos fuente Kubernetes para backend e infraestructura

k8s
  Entrada raiz para kubectl apply -k k8s
```

## Flujo general

```text
Frontend Docker
    |
    | HTTP/S
    v
Kong API Gateway en Kubernetes
    |
    +--> MS Usuarios/OAuth
    +--> MS Vehiculos
    +--> MS Zonas/Espacios/SSE
    +--> MS Tickets
    +--> MS Auditoria

RabbitMQ recibe eventos de dominio.
MS Auditoria consume eventos y los persiste.
Postgres guarda las bases de datos de los servicios.
```

## Microservicios

- `ms-usuarios-roles-oauth`: administra usuarios, roles, login y emision de JWT.
- `ms-vehiculos`: administra vehiculos por tenant.
- `ms-zonas-espacios`: administra zonas, espacios y eventos SSE.
- `ms-tickets`: administra tickets de ingreso/salida.
- `ms-audit`: consume eventos RabbitMQ y expone auditoria.

## API Gateway

Kong es la unica entrada externa a los microservicios. En Kubernetes se expone por:

```text
http://localhost:30080
```

En un cluster con Ingress:

```text
https://parqueadero.espe.edu.ec
```
