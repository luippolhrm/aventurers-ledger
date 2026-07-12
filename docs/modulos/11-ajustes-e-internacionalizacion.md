# Módulo 11 — Ajustes, internacionalización y tema

## Nombre y propósito

Configuración transversal de la experiencia: idioma de la interfaz, tema visual
y la página de ajustes del usuario.

## Estado

🔶 **Parcial** — el sistema de textos funciona (app 100% en español), pero el
multi-idioma es solo arquitectura sin segundo idioma; el tema sigue al sistema
operativo **sin toggle manual**; y la página `/settings` es una cáscara.

## Qué hace (perspectiva del usuario)

- Toda la interfaz está **en español**.
- El tema claro/oscuro se adapta automáticamente al del sistema operativo.
- `/settings` muestra únicamente "Configuración Adicional — próximamente".

## Cómo funciona

### Internacionalización (i18n)

- **Fuente de textos real**: `lib/texts.ts` (~1.150 líneas), un objeto tipado con
  todos los literales de la UI organizados por dominio (header, wallet,
  character, campaigns, marketplace, auth…).
- **Contexto**: `lib/language-context.tsx` expone `useLanguage()` →
  `{ t: texts, language: "es" }`. El tipo `Language = "es"` — **no existe otro
  idioma implementado**; añadir uno requiere ampliar el tipo y crear el objeto
  de textos alternativo.
- Muchos componentes aceptan una prop `language?: "es"` marcada "por
  compatibilidad, ya no se usa" — herencia de una iteración anterior.
- **Sistema paralelo legacy**: `lib/translations.ts` (~3.000 líneas) solo lo
  importa `currency-converter-service.ts` para los nombres de las monedas.
  El resto del archivo no se consume. ⚠️ Duplicación pendiente de decisión.
- Excepciones sin i18n detectadas: `/auth/sign-up-success` (inglés),
  `<html lang="en">` en el layout raíz, y textos hardcodeados sueltos en
  varias vistas.

### Tema visual

- `app/layout.tsx` monta `ThemeProvider` (next-themes) con
  `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
- **No hay ningún componente que llame a `useTheme`** para cambiarlo: el usuario
  no puede forzar claro/oscuro desde la UI; siempre sigue al sistema.

### Página de ajustes

- `/settings` (server component con guard de sesión) → `settings-content.tsx`:
  una única tarjeta "próximamente". No hay preferencias funcionales (el idioma
  no es elegible, el tema tampoco).
  ⚠️ En `lib/texts.ts` existen textos preparados para preferencias de idioma
  ("Preferencias de Idioma", "Elige tu idioma…") que ninguna UI usa.

## Datos que usa

Ninguna tabla propia. No hay persistencia de preferencias de usuario (ni idioma
ni tema) en BD ni en localStorage — salvo lo que next-themes guarda
internamente para el tema resuelto.

## Interacción con otros módulos

Transversal: todos los módulos consumen `useLanguage().t` para sus textos.

## Archivos involucrados

`lib/language-context.tsx` · `lib/texts.ts` · `lib/translations.ts` (legacy
parcial) · `components/theme-provider.tsx` · `app/layout.tsx` ·
`app/(app)/settings/page.tsx` · `components/settings-content.tsx`
