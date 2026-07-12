# Documentación funcional — Aventurer's Ledger

Documentación funcional completa del proyecto: qué está hecho y cómo funciona,
sin necesidad de leer el código. Generada a partir de la lectura directa del
código fuente (julio 2026). Cada afirmación es verificable en los archivos
referenciados; lo no verificable está marcado como **⚠️ Por verificar**.

## Índice

### Documentos generales

| Documento | Contenido |
|---|---|
| [01 — Visión general](./01-vision-general.md) | Qué es el proyecto, stack, cómo se ejecuta y despliega, estructura de carpetas |
| [02 — Arquitectura funcional](./02-arquitectura-funcional.md) | Capas de la aplicación, mapa de pantallas y navegación, modelo de datos completo, seguridad (RLS/permisos), sistema de errores |
| [99 — Pendientes y hallazgos](./99-pendientes-y-hallazgos.md) | TODOs, funcionalidades incompletas, código muerto, inconsistencias y decisiones pendientes |

### Módulos funcionales (`modulos/`)

| # | Módulo | Estado |
|---|---|---|
| [01](./modulos/01-autenticacion-y-perfiles.md) | Autenticación y perfiles | ✅ Completo |
| [02](./modulos/02-personajes.md) | Personajes (hoja, especies, trasfondos, dotes, notas) | 🔶 Parcial |
| [03](./modulos/03-inventario.md) | Inventario (slots, contenedores, equipamiento) | ✅ Completo |
| [04](./modulos/04-economia.md) | Economía (monedero, movimientos, conversor, transferencias) | ✅ Completo |
| [05](./modulos/05-campanas.md) | Campañas (creación, invitación, miembros, roles) | ✅ Completo |
| [06](./modulos/06-mundo-ubicaciones-tiendas.md) | Mundo: ubicaciones y tiendas | ✅ Completo |
| [07](./modulos/07-npcs.md) | NPCs (inventario propio, distribución de botín) | 🔶 Parcial |
| [08](./modulos/08-mazmorras.md) | Mazmorras (dungeons, salas, NPCs de sala) | 🔶 Parcial |
| [09](./modulos/09-comercio.md) | Comercio (catálogo, carrito, checkout, historial) | 🔶 Parcial |
| [10](./modulos/10-dashboard-y-navegacion.md) | Dashboard y navegación | ✅ Completo |
| [11](./modulos/11-ajustes-e-internacionalizacion.md) | Ajustes, internacionalización y tema | 🔶 Parcial |

### Leyenda de estados

- ✅ **Completo**: la funcionalidad descrita opera de extremo a extremo.
- 🔶 **Parcial**: opera, pero con brechas conocidas (detalladas en cada documento).
- 🔴 **Solo esqueleto**: existe la estructura pero no la funcionalidad.

### Convenciones de esta documentación

- **Referencia normativa D&D**: PHB 2024. Las reglas que provienen de PHB 2014 o
  que se desvían de lo oficial (homebrew) están marcadas como tales, no corregidas.
- Las rutas de archivo son relativas a la raíz del repositorio.
- "GM" = Game Master; "RLS" = Row Level Security de Postgres/Supabase;
  "RPC" = función almacenada de Postgres invocada desde la app.
