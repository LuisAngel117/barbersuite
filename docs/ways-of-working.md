# Ways of Working (ChatGPT + Codex) — BarberSuite

Fecha: 2026-03-05

## 0) Regla #1 (Centro de verdad)
- La verdad vive en el repo (`/docs` + código).
- Si algo está **TBD**, no se implementa: primero se cierra con ADR/contrato.

## 1) Flujo de trabajo (estilo empresa)
Usamos **GitHub Flow** (ramas cortas + PR + CI + merge).
- GitHub Docs: https://docs.github.com/en/get-started/using-github/github-flow
- AWS Prescriptive Guidance (resumen): https://docs.aws.amazon.com/prescriptive-guidance/latest/choosing-git-branch-approach/github-flow-branching-strategy.html

### Pasos
1. Crear Issue/ticket con objetivo, alcance, criterios de aceptación.
2. Actualizar docs (ADRs/OpenAPI) si aplica.
3. Implementar en rama `feat/...` o `fix/...`.
4. Abrir PR con checklist y evidencia.
5. CI debe pasar; luego merge.

## 2) Reglas para Codex (VS Code)
- Codex ejecuta **micro-tareas** con alcance cerrado y referenciando docs.
- Si falta una decisión: parar y pedir actualizar ADR/doc. No “adivinar”.

## 3) Estándares base (resumen)
- Errores: Problem Details (RFC 7807) — https://www.rfc-editor.org/rfc/rfc7807.html
- Config/secrets: env vars (12-factor) — https://12factor.net/config
- Seguridad: prevenir BOLA (OWASP API Top 10 2023) —
  - https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
