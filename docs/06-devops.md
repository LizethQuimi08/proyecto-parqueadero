# DevOps

## Workflow

Workflow principal:

```text
.github/workflows/ci-cd.yml
```

## Jobs configurados

- Tests Java con Maven para:
  - `ms-usuarios-roles-oauth`
  - `ms-zonas-espacios`
- Build y tests NestJS para:
  - `ms-vehiculos`
  - `ms-tickets`
  - `ms-audit`
- Validacion frontend con `node --check`.
- Analisis SonarCloud.
- Build y push de imagenes Docker a GHCR.
- Deploy manual a Kubernetes con `workflow_dispatch`.
- Notificacion Telegram.

## Imagenes publicadas

```text
ghcr.io/<owner>/<repo>/ms-usuarios-roles-oauth
ghcr.io/<owner>/<repo>/ms-zonas-espacios
ghcr.io/<owner>/<repo>/ms-vehiculos
ghcr.io/<owner>/<repo>/ms-tickets
ghcr.io/<owner>/<repo>/ms-audit
ghcr.io/<owner>/<repo>/frontend
ghcr.io/<owner>/<repo>/kong
ghcr.io/<owner>/<repo>/rabbitmq
ghcr.io/<owner>/<repo>/postgres
```

El frontend se publica como imagen Docker, pero no se despliega en Kubernetes.

## Secrets requeridos

```text
SONAR_TOKEN
SONAR_ORGANIZATION
KUBE_CONFIG_B64
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

## Despliegue

El despliegue a Kubernetes es semiautomatizado. Se ejecuta manualmente desde GitHub Actions con:

```text
workflow_dispatch -> deploy = true
```

El deploy aplica:

```bash
kubectl apply -k k8s
```

## Telegram

El pipeline envia un mensaje con:

- Estado general del CI/CD.
- Rama.
- Commit.
- Repositorio.
