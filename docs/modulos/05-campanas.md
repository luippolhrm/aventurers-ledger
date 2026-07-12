# Módulo 05 — Campañas

## Nombre y propósito

Agrupa a un Game Master y sus jugadores en torno a una partida. Define los roles,
el flujo de unión por código de invitación y qué ve cada rol.

## Estado

✅ **Completo** — creación, unión por código, roles y gestión de miembros
funcionan. Existe además un **subsistema fantasma de invitaciones** completo en
la base de datos que ningún código de la app usa (ver hallazgos).

## Qué hace (perspectiva del usuario)

- Crear una campaña (nombre, descripción). El creador queda como **Game Master**
  y la campaña recibe un **código de invitación único** autogenerado.
- Compartir el código; otro jugador lo introduce desde su personaje
  (`/characters/[id]/join-campaign`) y se une como **jugador** con ese personaje.
- Estados de campaña: `active`, `paused`, `completed`, `archived`.
- El **GM** ve el hub con: Miembros, Explorar Mundo y Configuración; puede
  editar la campaña, regenerar el código, expulsar miembros, archivar.
- El **jugador** ve tabs: Resumen (su personaje), Monedero, Inventario,
  Movimientos y Mundo (para visitar tiendas).
- Un usuario puede ser GM de unas campañas y jugador en otras a la vez.

## Cómo funciona

### Roles — fuente de verdad

El rol GM se determina por **`campaigns.game_master_id`** (no por la tabla de
miembros): así lo aplican `PermissionUtils.ensureGameMaster` y el dashboard.
En `campaign_members`, el GM figura con `role='game_master'` y
`character_id NULL`; los jugadores con `role='player'` y su personaje.

### Crear (`CampaignService.createCampaign`)
1. Fuerza `game_master_id = usuario autenticado` y estado `active`.
2. El trigger de BD genera el `invite_code` único.
3. El servicio añade al creador como miembro `game_master` (el trigger de BD que
   hacía esto fue eliminado en la migración 042 — ahora es responsabilidad de la
   app).

### Unirse (`joinCampaignByInviteCode`)
1. Busca la campaña por código (consulta directa a `campaigns.invite_code`).
2. Rechaza si ya es miembro o si es el GM ("Game Master cannot join as a
   player").
3. Inserta el miembro `player` con el personaje elegido.

### Gestión de miembros
- Listar miembros usa la RPC **`get_campaign_members`** (SECURITY DEFINER), que
  verifica que quien consulta sea GM o miembro — así se evita la recursión de
  RLS en `campaign_members`. Los nombres de personajes llegan por
  `get_campaign_character_names`.
- **Expulsar** (`removeMember`): puede el GM, o uno mismo (salirse). El GM no
  puede quitarse a sí mismo ni abandonar la campaña (`leaveCampaign` lo
  bloquea).
- **Cambiar rol** (`updateMemberRole`): solo GM; el rol del GM no se puede
  cambiar.

### Reglas y validaciones

| Regla | Dónde |
|---|---|
| Solo el GM edita/borra/regenera código/archiva | `ensureGameMaster` + RLS |
| El GM no puede unirse como jugador ni abandonar | `CampaignService` |
| No duplicar membresía | servicio + `UNIQUE(campaign_id, user_id, character_id)` |
| Estados válidos | CHECK en BD |
| Miembros solo ven campañas propias o donde participan | RLS + RPC |

### Subsistema fantasma: `campaign_invitations`

En la BD existe una tabla completa de invitaciones dirigidas (por usuario o
email, con estados pending/accepted/rejected/cancelled, expiración, mensajes),
4 funciones RPC (`accept_campaign_invitation`, `find_campaign_id_by_invite_code`,
`get_current_user_email`, `user_has_pending_invitation_to_campaign`) y políticas
RLS. **Ningún repositorio ni servicio TS la referencia**: el único flujo real de
unión es el código de invitación. Hay textos de "invitación" en
`lib/translations.ts` pero sin pantalla asociada. Decisión pendiente: cablearlo
o retirarlo (ver hallazgos).

## Datos que usa

| Tabla | Rol |
|---|---|
| `campaigns` | la campaña, su GM, estado y código |
| `campaign_members` | quién participa, con qué rol y personaje |
| `campaign_invitations` | ⚠️ fantasma (solo BD) |

## Interacción con otros módulos

- **Personajes**: la unión asocia un personaje; el dashboard separa personajes
  asignados/libres por la membresía.
- **Mundo / Mazmorras / NPCs / Comercio**: todo el contenido de mundo pertenece
  a una campaña y su gestión exige ser su GM.

## Archivos involucrados

`app/(app)/campaigns/page.tsx` · `app/(app)/campaigns/new/page.tsx` ·
`app/(app)/campaigns/[campaignId]/page.tsx` + `members/page.tsx` ·
`components/campaigns.tsx` (lista GM, legacy) · `components/campaign-view.tsx`
(hub, legacy) · `components/features/campaigns/*` (create-view,
members-content, player-campaign-tabs) ·
`components/features/character/character-join-campaign-view.tsx` ·
`lib/application/services/campaign-service.ts` ·
`lib/application/utils/permissions.ts` ·
`lib/infrastructure/repositories/campaign-repository.ts` ·
`campaign-member-repository.ts` · migraciones `018–028, 033, 040–042,
048–053, 054b, 058c`
