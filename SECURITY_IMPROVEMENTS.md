# Mejoras de Seguridad y Autenticación

Este documento describe las mejoras implementadas en el sistema de autenticación, autorización y protección de rutas.

## Fecha de Implementación
Enero 2026

## Objetivos Completados

### 1. ✅ Helper Central de Permisos

**Ubicación:** `lib/application/utils/permissions.ts`

Se creó una clase utilitaria centralizada `PermissionUtils` que proporciona métodos reutilizables para validar permisos en toda la aplicación.

#### Métodos Disponibles

##### Métodos que lanzan excepciones (ensure*)

- **`ensureGameMaster(userId, campaignId)`**: Valida que un usuario es Game Master de una campaña
- **`ensureCampaignMember(userId, campaignId)`**: Valida que un usuario es miembro de una campaña
- **`ensureCharacterOwner(userId, characterId)`**: Valida que un usuario es dueño de un personaje
- **`ensureCharacterAccess(userId, characterId, campaignId?)`**: Valida que un usuario tiene acceso a un personaje (dueño o GM)
- **`ensurePlayerMember(userId, campaignId, characterId?)`**: Valida que un usuario es jugador en una campaña

##### Métodos que retornan boolean (is*)

- **`isGameMaster(userId, campaignId)`**: Verifica si un usuario es GM sin lanzar error
- **`isCampaignMember(userId, campaignId)`**: Verifica si un usuario es miembro sin lanzar error
- **`isCharacterOwner(userId, characterId)`**: Verifica si un usuario es dueño sin lanzar error

#### Ejemplo de Uso

```typescript
import { PermissionUtils } from "@/lib/application/utils"

// En un servicio
async updateCampaign(campaignId: string, updates: UpdateCampaign, userId: string) {
  // Lanza error si el usuario no es GM
  await PermissionUtils.ensureGameMaster(userId, campaignId)
  
  return this.campaignRepo.update(campaignId, updates)
}

// Verificación sin lanzar error
async someMethod(userId: string, campaignId: string) {
  const isGM = await PermissionUtils.isGameMaster(userId, campaignId)
  
  if (isGM) {
    // Lógica especial para GM
  }
}
```

### 2. ✅ Protección de Rutas

**Ubicación:** `components/auth/protected-route.tsx`

Se creó un componente `ProtectedRoute` que protege rutas requiriendo autenticación.

#### Características

- Redirige automáticamente a `/auth/login` si no hay sesión
- Muestra un loading spinner mientras verifica la sesión
- Evita flickers mostrando loading durante la redirección
- Configurable con prop `redirectTo` para personalizar la ruta de redirección

#### Implementación

El componente se integró en el layout principal de la aplicación:

```typescript
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      {/* Todo el contenido de la app */}
    </ProtectedRoute>
  )
}
```

**Rutas Protegidas:**
- `/dashboard`
- `/profile`
- `/settings`
- `/characters/*`
- `/campaigns/*`

### 3. ✅ Limpieza de UI - Sidebar

**Ubicación:** `components/sidebar.tsx`

Se eliminó el enlace roto `/currency-converter` del sidebar que apuntaba a una ruta inexistente.

**Cambios:**
- Eliminado el item "Conversor de Monedas" del menú principal
- Eliminado el import de `Coins` de lucide-react (ya no se usa)
- Limpiado el código de detección de módulo activo

### 4. ✅ Mejoras en AuthProvider

**Ubicación:** `lib/auth-context.tsx`

Se mejoró el `AuthProvider` para garantizar una gestión de sesión más robusta.

#### Mejoras Implementadas

1. **Listener de cambios de autenticación**: Ahora escucha eventos de Supabase Auth:
   - `SIGNED_IN`: Cuando el usuario inicia sesión
   - `SIGNED_OUT`: Cuando el usuario cierra sesión
   - `TOKEN_REFRESHED`: Cuando se refresca el token automáticamente
   - `USER_UPDATED`: Cuando se actualiza el usuario

2. **Loading state claro**: 
   - Inicializa en `true` para evitar flickers
   - Se actualiza correctamente en todos los flujos
   - Expuesto en el contexto para uso en componentes

3. **Carga automática de perfil**:
   - Carga el perfil del usuario automáticamente al iniciar sesión
   - Maneja errores gracefully si el perfil no existe

#### Interfaz del Contexto

```typescript
interface AuthContextType {
  user: User | null          // Usuario de Supabase
  profile: Profile | null    // Perfil del usuario
  loading: boolean           // Estado de carga
}
```

### 5. ✅ Integración en Servicios

Se integraron los helpers de permisos en los servicios principales:

#### Servicios Actualizados

1. **CampaignService** (`lib/application/services/campaign-service.ts`)
   - `updateCampaign()`: Usa `ensureGameMaster()`
   - `deleteCampaign()`: Usa `ensureGameMaster()`
   - `generateInviteCode()`: Usa `ensureGameMaster()`
   - `addMember()`: Usa `ensureGameMaster()`
   - `updateMemberRole()`: Usa `ensureGameMaster()`

2. **DungeonService** (`lib/application/services/dungeon-service.ts`)
   - `createDungeon()`: Usa `ensureGameMaster()`
   - `updateDungeon()`: Usa `ensureGameMaster()`
   - `deleteDungeon()`: Usa `ensureGameMaster()`
   - `createRoom()`: Usa `ensureGameMaster()`
   - `updateRoom()`: Usa `ensureGameMaster()`
   - `deleteRoom()`: Usa `ensureGameMaster()`
   - `associateNpcToRoom()`: Usa `ensureGameMaster()`
   - `disassociateNpcFromRoom()`: Usa `ensureGameMaster()`

3. **NpcService** (`lib/application/services/npc-service.ts`)
   - `createNpc()`: Usa `ensureGameMaster()`
   - `updateNpc()`: Usa `ensureGameMaster()`
   - `deleteNpc()`: Usa `ensureGameMaster()`
   - `associateToShop()`: Usa `ensureGameMaster()`
   - `disassociateFromShop()`: Usa `ensureGameMaster()`
   - `addInventoryItem()`: Usa `ensureGameMaster()`
   - `updateInventoryItem()`: Usa `ensureGameMaster()`
   - `removeInventoryItem()`: Usa `ensureGameMaster()`
   - `distributeCurrency()`: Usa `ensureGameMaster()`

## Beneficios

### 1. Consistencia
- Todas las validaciones de permisos usan la misma lógica centralizada
- Mensajes de error consistentes en toda la aplicación
- Reduce duplicación de código

### 2. Mantenibilidad
- Un solo lugar para actualizar la lógica de permisos
- Más fácil de testear
- Código más limpio y legible

### 3. Seguridad
- Todas las rutas protegidas redirigen automáticamente a login
- Validaciones de permisos centralizadas y consistentes
- Menos probabilidad de olvidar validar permisos

### 4. Experiencia de Usuario
- Loading states claros sin flickers
- Redirecciones suaves
- Feedback visual durante la verificación de sesión

## Arquitectura

Siguiendo los principios de Clean Architecture definidos en `ARCHITECTURE.md`:

```
Presentation Layer (components/auth/)
    ↓
Application Layer (lib/application/utils/permissions.ts)
    ↓
Infrastructure Layer (repositories)
    ↓
Database (Supabase)
```

Los helpers de permisos están en la capa de **Application** (utils), lo que permite:
- Reutilización en todos los servicios
- Independencia de la infraestructura
- Fácil testing con mocks

## Próximos Pasos (Opcional)

### Mejoras Futuras Sugeridas

1. **Middleware de Next.js**: Considerar implementar middleware para proteger rutas a nivel de servidor
2. **Caché de permisos**: Implementar caché temporal para reducir queries de permisos
3. **Roles más granulares**: Expandir el sistema de roles si es necesario (co-GM, moderador, etc.)
4. **Auditoría**: Agregar logging de acciones sensibles (cambios de permisos, eliminaciones, etc.)

## Testing

Para testear los helpers de permisos:

```typescript
import { PermissionUtils } from "@/lib/application/utils"

// Mock de repositorios
jest.mock("@/lib/infrastructure/repositories/campaign-member-repository")

describe("PermissionUtils", () => {
  it("should throw error if user is not GM", async () => {
    // Setup mock
    await expect(
      PermissionUtils.ensureGameMaster("user-id", "campaign-id")
    ).rejects.toThrow("Only the Game Master can perform this action")
  })
})
```

## Referencias

- **Arquitectura**: Ver `ARCHITECTURE.md`
- **Código de Errores**: Ver `lib/infrastructure/errors/`
- **Repositorios**: Ver `lib/infrastructure/repositories/`
