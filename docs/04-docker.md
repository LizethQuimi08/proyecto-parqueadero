# Docker

## Dockerfiles existentes

Cada microservicio y componente principal tiene Dockerfile:

```text
Backend/Monitoreo/Dockerfile
ParkingApp/App/ms-usuarios-roles-oauth/Dockerfile
ParkingApp/App/ms-zonas-espacios/Dockerfile
ParkingApp/App/ms-vehiculos/Dockerfile
ParkingApp/App/ms-tickets/Dockerfile
ParkingApp/App/ms-audit/Dockerfile
ParkingApp/docker/kong/Dockerfile
ParkingApp/docker/rabbitmq/Dockerfile
ParkingApp/docker/postgres/Dockerfile
```

## Frontend Docker

Compose exclusivo:

```text
docker-compose.frontend.yml
```

Comando:

```bash
docker compose -f docker-compose.frontend.yml up --build
```

## Stack Docker Compose backend local

Archivo:

```text
ParkingApp/docker-compose.yml
```

Valida la configuracion con:

```bash
docker compose -f ParkingApp/docker-compose.yml config --quiet
```

Nota: este compose conserva el stack local historico del proyecto. Para el flujo final solicitado, Kubernetes levanta backend/infraestructura y Docker levanta frontend.
