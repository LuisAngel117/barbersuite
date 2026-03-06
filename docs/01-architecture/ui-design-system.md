# UI Design System

## Direccion visual
BarberSuite usa una base visual inspirada en Linear/Vercel:
- neutrales charcoal para superficies y tipografia
- acentos amber sutiles para foco, badges y highlights
- densidad compacta, bordes suaves y contraste alto

## Stack del sistema
- Tailwind CSS como capa de layout y spacing
- shadcn/ui para primitives y componentes base
- `next-themes` para dark mode real basado en clase
- Inter variable font como `font-sans`
- Sonner para toasts

## Tokens
Los tokens viven en `frontend/src/app/globals.css` y siguen el esquema de shadcn:
- `:root` define el tema light
- `.dark` redefine el tema dark

Variables custom agregadas:
- `--brand`
- `--brand-foreground`
- `--brand-muted`
- `--brand-ring`

Decision visual:
- `primary` permanece neutral/charcoal
- `brand` concentra el amber del producto
- `ring` apunta al brand para que el foco se sienta BarberSuite sin teñir toda la UI

## Dark mode
El dark mode usa `next-themes` con `attribute="class"`:
- `ThemeProvider` envuelve el layout raiz
- `ThemeToggle` permite cambiar entre `light`, `dark` y `system`
- la clase `.dark` en `html` activa el set de tokens oscuro

## Tipografia
Inter variable se carga desde `next/font/google` y se expone como `--font-sans`.
La app completa usa `font-sans` como base para mantener una lectura limpia y consistente.

## Componentes base
Componentes disponibles en `frontend/src/components/ui`:
- `button`
- `input`
- `label`
- `card`
- `badge`
- `separator`
- `dropdown-menu`
- `dialog`
- `sheet`
- `skeleton`
- `sonner`
- `textarea`
- `checkbox`

## Toasts
La app usa Sonner como sistema de feedback global.

Motivo:
- el toast de Radix ya no es la opcion recomendada por shadcn
- Sonner ofrece un flujo mas simple para acciones operativas y feedback optimista

El `Toaster` se monta una sola vez en el layout raiz.

## Validacion visual
La ruta interna `/app/ui-kit` sirve para validar:
- botones y badges
- cards
- dialog y sheet
- skeletons
- toasts
- light/dark mode
