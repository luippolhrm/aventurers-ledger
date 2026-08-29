# Módulo 10 — Dashboard y navegación

## Nombre y propósito

Pantalla de inicio tras el login y estructura de navegación global (sidebar,
hubs con tarjetas). Da acceso rápido a campañas y personajes según el rol del
usuario en cada campaña.

## Estado

✅ **Completo** — con particularidades: usa componentes de la generación legacy,
la conmutación de módulos va por query param, y el conversor de monedas no
tiene enlace visible.

## Qué hace (perspectiva del usuario)

- Al entrar (`/dashboard`) ve el **resumen** (`DashboardOverview`):
  - Campañas donde es **GM** (con número de miembros).
  - Campañas donde participa como **jugador** (con su personaje asignado).
  - Personajes **libres** (sin campaña) con acceso directo a su hoja.
- **Sidebar** fijo (drawer en móvil) con: Inicio, Aventureros, Campañas, y abajo
  Perfil, Configuración y Cerrar sesión.
- Navegación por **hubs con tarjetas** (patrón NavigationCard): el hub del
  personaje (Hoja / Inventario / Historia / Mis Campañas) y el hub de campaña
  del GM (Miembros / Explorar Mundo / Configuración).

## Cómo funciona

### Conmutación por query param
`/dashboard?module=` cambia la vista sin cambiar de ruta:
| Valor | Vista | Componente |
|---|---|---|
| `welcome` (default) | Resumen | `DashboardOverview` (legacy) |
| `campaigns` | Campañas | `Campaigns` (legacy) |
| `characters` | Personajes | `CharactersUnified` (legacy) |
| `currency-converter` | Conversor de monedas | `CurrencyExchangeCard` (legacy) |

⚠️ El conversor **no tiene enlace visible** en sidebar ni overview: solo se
llega escribiendo la URL. (El sidebar tuvo ese enlace y se eliminó — ver
`SECURITY_IMPROVEMENTS.md` §3.)

### Cómo separa GM vs jugador
`DashboardOverview` y `dashboard-view` derivan el rol comparando
`campaign.game_master_id === user.id` (la fuente de verdad de roles), y cargan
los personajes agrupados con `CharacterService.getCharactersByStatus`
(asignados a campaña vs libres, según `campaign_members`).

⚠️ Nota de duplicidad: existe `components/features/dashboard/dashboard-view.tsx`
(generación nueva) pero la ruta `/dashboard` monta el legacy
`DashboardOverview`. Ambos coexisten; ver hallazgos.

### Título de página
Hook `use-page-title.ts`: usado por `/dashboard`, `/characters` y `/campaigns`
para fijar el título del documento.

## Datos que usa

Solo lectura, vía servicios: `campaigns` + `campaign_members` (rol y conteos),
`characters` (agrupación asignados/libres). No escribe nada.

## Interacción con otros módulos

Es la puerta de entrada a Personajes (módulo 02), Campañas (05) y, vía el hub de
campaña, al Mundo (06), NPCs (07), Mazmorras (08) y Comercio (09).

## Archivos involucrados

`app/(app)/dashboard/page.tsx` · `components/dashboard-overview.tsx` ·
`components/campaigns.tsx` · `components/characters-unified.tsx` ·
`components/currency-exchange-card.tsx` · `components/sidebar.tsx` ·
`components/features/dashboard/dashboard-view.tsx` (paralelo sin montar en la
ruta) · `hooks/use-page-title.ts` · `app/(app)/layout.tsx`
