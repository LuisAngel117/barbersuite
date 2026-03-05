# Repo Layout

## Objetivo
Este repositorio adopta un layout monorepo simple para mantener backend, frontend y documentación en un mismo source of truth. La documentación sigue viviendo en `/docs` y precede a la implementación.

## Estructura
```text
/
|- backend/   # código y build del backend (Spring Boot)
|- frontend/  # código y build del frontend (React / Next.js)
|- docs/      # producto, arquitectura, API y ADRs
|- .editorconfig
|- .gitattributes
|- .gitignore
|- README.md
|- CONTRIBUTING.md
```

## Por qué este layout
- Mantiene una separación clara entre los stacks de Java y Node sin dividir el proyecto en múltiples repositorios.
- Permite cambios coordinados entre contratos, ADRs, backend y frontend en un solo commit o pull request.
- Deja el root reservado para configuración compartida, CI, documentación y archivos de gobierno del repositorio.
- Refuerza el enfoque docs-as-code: primero se define en `/docs`, luego se implementa en `/backend` y `/frontend`.

## Convenciones iniciales
- El código de aplicación no debe vivir en el root del repositorio.
- Todo el backend irá dentro de `/backend`.
- Todo el frontend irá dentro de `/frontend`.
- Los `.gitkeep` preservan la estructura mínima mientras todavía no existe código de aplicación.
