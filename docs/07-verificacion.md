# Verificacion

## Validaciones ejecutadas

### Frontend

```bash
node --check Backend/Monitoreo/app.js
```

Resultado: OK.

### Kubernetes

```bash
kubectl kustomize k8s
```

Resultado: OK.

### Docker Compose frontend

```bash
docker compose -f docker-compose.frontend.yml config --quiet
```

Resultado: OK.

### Docker Compose backend

```bash
docker compose -f ParkingApp/docker-compose.yml config --quiet
```

Resultado: OK.

Docker muestra advertencia porque `version` en compose es obsoleto, pero no bloquea la configuracion.

### NestJS

```bash
npm run build
```

Ejecutado en:

- `ParkingApp/App/ms-vehiculos`
- `ParkingApp/App/ms-tickets`
- `ParkingApp/App/ms-audit`

Resultado: OK.

## Limitaciones de validacion

No se compilaron los microservicios Java localmente porque:

- `mvn` no esta disponible en PATH.
- No existen wrappers `mvnw` en los modulos Java.

El despliegue real con `kubectl apply` no se ejecuto porque el contexto local de `kubectl` apuntaba a GKE con credenciales bloqueadas. Se valido la generacion de manifiestos con `kubectl kustomize`.
