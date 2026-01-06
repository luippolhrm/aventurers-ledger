# CampaignRepository y CampaignService - IMPLEMENTADOS ✅

## Resumen

Se ha completado la implementación del repositorio y servicio de campañas, siguiendo el mismo patrón establecido con WalletRepository, CharacterRepository e InventoryRepository.

---

## ✅ Archivos Creados

### 1. Tipos e Interfaces
**Ubicación:** `lib/infrastructure/repositories/campaign-repository.types.ts`

- ✅ `Campaign` - Interface completa con todos los campos
- ✅ `CreateCampaign` - Tipo para crear campañas
- ✅ `UpdateCampaign` - Tipo para actualizar campañas
- ✅ `CampaignStatus` - Tipo para estados de campaña
- ✅ `CampaignMember` - Interface para miembros de campaña
- ✅ `CreateCampaignMember` - Tipo para crear miembros
- ✅ `UpdateCampaignMember` - Tipo para actualizar miembros
- ✅ `CampaignMemberRole` - Tipo para roles (game_master | player)

**Campos de Campaign:**
- id, name, description, game_master_id, status, invite_code, created_at, updated_at

**Campos de CampaignMember:**
- id, campaign_id, user_id, character_id, role, joined_at

---

### 2. CampaignRepository
**Ubicación:** `lib/infrastructure/repositories/campaign-repository.ts`

#### Interface
```typescript
interface CampaignRepository {
  getById(campaignId: string): Promise<Campaign | null>
  getByUserId(userId: string): Promise<Campaign[]>
  getByGameMaster(userId: string): Promise<Campaign[]>
  getByInviteCode(inviteCode: string): Promise<Campaign | null>
  create(campaign: CreateCampaign): Promise<Campaign>
  update(campaignId: string, updates: UpdateCampaign): Promise<Campaign>
  delete(campaignId: string): Promise<void>
  generateInviteCode(campaignId: string): Promise<Campaign>
}
```

#### Implementación
- ✅ `SupabaseCampaignRepository` - Implementación completa
- ✅ Mapeo automático de datos de Supabase
- ✅ Manejo de errores usando `ErrorService`
- ✅ Generación de códigos de invitación únicos
- ✅ Todos los métodos implementados

---

### 3. CampaignMemberRepository
**Ubicación:** `lib/infrastructure/repositories/campaign-member-repository.ts`

#### Interface
```typescript
interface CampaignMemberRepository {
  getById(memberId: string): Promise<CampaignMember | null>
  getByCampaignId(campaignId: string): Promise<CampaignMember[]>
  getByUserId(userId: string): Promise<CampaignMember[]>
  getByCharacterId(characterId: string): Promise<CampaignMember[]>
  getByCampaignAndUser(campaignId: string, userId: string): Promise<CampaignMember | null>
  getByCampaignUserAndCharacter(campaignId: string, userId: string, characterId: string): Promise<CampaignMember | null>
  addMember(member: CreateCampaignMember): Promise<CampaignMember>
  updateRole(memberId: string, role: CampaignMemberRole): Promise<CampaignMember>
  update(memberId: string, updates: UpdateCampaignMember): Promise<CampaignMember>
  removeMember(memberId: string): Promise<void>
  removeByCampaignUserAndCharacter(campaignId: string, userId: string, characterId: string | null): Promise<void>
  validateAccess(userId: string, campaignId: string): Promise<boolean>
  isGameMaster(userId: string, campaignId: string): Promise<boolean>
}
```

#### Implementación
- ✅ `SupabaseCampaignMemberRepository` - Implementación completa
- ✅ Mapeo automático de datos de Supabase
- ✅ Manejo de errores usando `ErrorService`
- ✅ Validaciones de acceso
- ✅ Todos los métodos implementados

---

### 4. CampaignService
**Ubicación:** `lib/application/services/campaign-service.ts`

#### Métodos Principales

**CRUD de Campañas:**
- ✅ `getCampaign(campaignId)` - Obtiene una campaña por ID
- ✅ `getUserCampaigns(userId)` - Obtiene todas las campañas de un usuario
- ✅ `getCampaignsAsGM(userId)` - Obtiene campañas donde el usuario es GM
- ✅ `getCampaignByInviteCode(inviteCode)` - Obtiene campaña por código de invitación
- ✅ `createCampaign(campaignData, userId)` - Crea campaña y agrega automáticamente al GM
- ✅ `updateCampaign(campaignId, updates, userId)` - Actualiza campaña (solo GM)
- ✅ `deleteCampaign(campaignId, userId)` - Elimina campaña (solo GM)
- ✅ `generateInviteCode(campaignId, userId)` - Genera nuevo código de invitación

**Gestión de Miembros:**
- ✅ `getCampaignMembers(campaignId)` - Obtiene miembros de una campaña
- ✅ `getUserMembers(userId)` - Obtiene miembros de un usuario
- ✅ `getCharacterMembers(characterId)` - Obtiene miembros de un personaje
- ✅ `joinCampaign(campaignId, userId, characterId)` - Unirse a campaña como player
- ✅ `joinCampaignByInviteCode(inviteCode, userId, characterId)` - Unirse usando código
- ✅ `addMember(campaignId, userId, characterId, role, gmUserId)` - Agregar miembro (solo GM)
- ✅ `removeMember(memberId, userId, campaignId)` - Remover miembro
- ✅ `leaveCampaign(campaignId, userId, characterId)` - Abandonar campaña
- ✅ `updateMemberRole(memberId, role, gmUserId, campaignId)` - Actualizar rol (solo GM)

**Validaciones:**
- ✅ `validateAccess(userId, campaignId)` - Valida acceso a campaña
- ✅ `isGameMaster(userId, campaignId)` - Valida si es Game Master

---

## 🎯 Lógica de Negocio Implementada

### Validaciones de Acceso
- ✅ Solo el GM puede actualizar/eliminar campañas
- ✅ Solo el GM puede agregar miembros
- ✅ Solo el GM puede actualizar roles
- ✅ Usuarios pueden unirse a campañas como players
- ✅ Usuarios pueden abandonar campañas (excepto GM)
- ✅ GM no puede abandonar su propia campaña
- ✅ GM no puede cambiar su propio rol

### Gestión de Roles
- ✅ GM se agrega automáticamente al crear campaña
- ✅ GM tiene `character_id: null` (es el usuario, no un personaje)
- ✅ Players tienen `character_id` asignado
- ✅ Validación de roles antes de operaciones

### Códigos de Invitación
- ✅ Generación automática de códigos únicos
- ✅ Búsqueda de campañas por código
- ✅ Validación de códigos antes de unirse

### Creación de Campañas
- ✅ Crea la campaña
- ✅ Agrega automáticamente al creador como GM
- ✅ Valida datos antes de crear

---

## 📋 Próximos Pasos

### Refactorizar Campaigns Component
Ahora que tenemos el repositorio y servicio, podemos refactorizar `components/campaigns.tsx`:

1. **Reemplazar acceso directo a Supabase** por `CampaignService`
2. **Separar en sub-componentes:**
   - `CampaignList` - Lista de campañas
   - `CampaignForm` - Formulario crear/editar
   - `CampaignMembers` - Gestión de miembros
   - `CampaignInvite` - Sistema de invitaciones
3. **Usar nuevos componentes:**
   - `LoadingState` para carga
   - `EmptyState` para estados vacíos
   - `CampaignCard` component (ya existe)

**Beneficio esperado:** Reducir de ~1000 líneas a ~300 líneas

---

## 🚀 Cómo Usar

### CampaignService
```typescript
import { CampaignService } from "@/lib/application/services"

const campaignService = new CampaignService()

// Crear campaña
const { campaign, member } = await campaignService.createCampaign({
  name: "Mi Campaña",
  description: "Descripción",
  game_master_id: userId,
  status: "active",
}, userId)

// Unirse a campaña por código
const { campaign, member } = await campaignService.joinCampaignByInviteCode(
  "ABC12345",
  userId,
  characterId
)

// Obtener campañas del usuario
const campaigns = await campaignService.getUserCampaigns(userId)

// Obtener miembros de una campaña
const members = await campaignService.getCampaignMembers(campaignId)

// Validar acceso
const hasAccess = await campaignService.validateAccess(userId, campaignId)
```

### Repositorios (si necesitas acceso directo)
```typescript
import { SupabaseCampaignRepository, SupabaseCampaignMemberRepository } from "@/lib/infrastructure/repositories"

const campaignRepo = new SupabaseCampaignRepository()
const memberRepo = new SupabaseCampaignMemberRepository()

const campaign = await campaignRepo.getById(campaignId)
const members = await memberRepo.getByCampaignId(campaignId)
```

---

## ✅ Estado Actual

- ✅ CampaignRepository implementado
- ✅ CampaignMemberRepository implementado
- ✅ CampaignService implementado
- ✅ Validaciones de negocio completas
- ✅ Lógica de roles y acceso
- ✅ Sistema de invitaciones
- ✅ Listo para usar en componentes

---

**Fecha de completación:** 2025-01-05  
**Siguiente paso:** Refactorizar `components/campaigns.tsx` usando el nuevo servicio

