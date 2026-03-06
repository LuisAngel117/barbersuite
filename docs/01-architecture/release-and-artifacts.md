# Release and Artifacts

## Objetivo
Este repo publica imagenes Docker versionadas en GitHub Container Registry (GHCR) para que el sistema pueda probarse sin clonar el codigo fuente.

Imagenes publicadas:
- `ghcr.io/<owner>/barbersuite-backend`
- `ghcr.io/<owner>/barbersuite-frontend`

## Como publicar
La publicacion automatica vive en `.github/workflows/release-images.yml`.

Forma recomendada:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Tambien puedes disparar el workflow manualmente con `workflow_dispatch` y un `tag` opcional, por ejemplo `v0.1.0`.

## Que etiquetas genera
Cada release publica:
- `vX.Y.Z`
- `sha-<short>`

En `workflow_dispatch`, la etiqueta semver solo se genera si envias el input `tag` o ejecutas el workflow sobre una referencia que ya sea tag.

## Ejemplos de imagen
Para el tag `v0.1.0`:
- `ghcr.io/<owner>/barbersuite-backend:v0.1.0`
- `ghcr.io/<owner>/barbersuite-frontend:v0.1.0`
- `ghcr.io/<owner>/barbersuite-backend:sha-<short>`
- `ghcr.io/<owner>/barbersuite-frontend:sha-<short>`

## Como probar rapido
```bash
docker pull ghcr.io/<owner>/barbersuite-backend:v0.1.0
docker pull ghcr.io/<owner>/barbersuite-frontend:v0.1.0
```

Notas:
- El workflow usa `GITHUB_TOKEN`, no un PAT.
- El workflow necesita `packages: write`.
- La publicacion incluye labels OCI generadas por `docker/metadata-action`, incluida la referencia al repo origen.

## Detalle de build
- `frontend` se construye directamente desde su `Dockerfile`.
- `backend` necesita empaquetar primero el jar (`./backend/mvnw -q -DskipTests package`) porque su `Dockerfile` consume `target/*.jar`.
