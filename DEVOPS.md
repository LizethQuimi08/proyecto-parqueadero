# DevOps

## Estructura monorepo

- `Backend/Monitoreo`: frontend dockerizado, fuera de Kubernetes.
- `ParkingApp/App/ms-usuarios-roles-oauth`: usuarios, roles, OAuth y JWT.
- `ParkingApp/App/ms-zonas-espacios`: zonas, espacios y SSE.
- `ParkingApp/App/ms-vehiculos`: vehiculos.
- `ParkingApp/App/ms-tickets`: tickets.
- `ParkingApp/App/ms-audit`: auditoria.
- `ParkingApp/k8s`: manifiestos Kubernetes fuente para backend, infraestructura, Kong e Ingress.
- `k8s`: entrada raiz para `kubectl apply -k k8s`.

## GitHub Actions

Workflow principal:

```text
.github/workflows/ci-cd.yml
```

Incluye:

- Tests Java con Maven.
- Build/tests NestJS.
- Validacion del frontend.
- Analisis SonarCloud.
- Build y push de imagenes Docker a GHCR.
- Deploy manual a Kubernetes del backend/infraestructura. El frontend se publica como imagen Docker, pero no se despliega en Kubernetes.
- Notificacion Telegram.

## Secrets requeridos

Configura estos secrets en GitHub:

```text
SONAR_TOKEN
SONAR_ORGANIZATION
KUBE_CONFIG_B64
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

`KUBE_CONFIG_B64` debe contener el kubeconfig codificado en base64.

## Registro de imagenes

El pipeline publica en GitHub Container Registry:

```text
ghcr.io/<owner>/<repo>/<servicio>:<sha>
ghcr.io/<owner>/<repo>/<servicio>:latest
```

Servicios publicados:

- `ms-usuarios-roles-oauth`
- `ms-zonas-espacios`
- `ms-vehiculos`
- `ms-tickets`
- `ms-audit`
- `frontend`
- `kong`
- `rabbitmq`
- `postgres`

## Despliegue

El despliegue a Kubernetes es semiautomatizado con `workflow_dispatch`.

Desde GitHub Actions, ejecuta el workflow y selecciona:

```text
deploy = true
```

El pipeline reemplaza `ghcr.io/OWNER/REPOSITORY` por el repositorio real y aplica:

```bash
kubectl apply -k k8s
```
