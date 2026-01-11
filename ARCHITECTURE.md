# Arquitectura del Proyecto - Versión Simplificada

## Visión General

Este proyecto sigue una arquitectura por capas simplificada, donde los **Servicios de Aplicación actúan como Casos de Uso**. No hay una capa separada de casos de uso para mantener la simplicidad y evitar duplicación innecesaria.

## Estructura de Capas

### 📁 Application (Servicios = Casos de Uso)

**Ubicación:** `lib/application/services/`

**Responsabilidad:** Contiene toda la lógica de negocio y orquesta las operaciones.

**Características:**
- Los servicios **SON** los casos de uso
- Contienen validaciones, lógica de negocio y coordinación
- Usan repositorios para acceso a datos
- Pueden usar otros servicios (composición)
- Utilizan `ValidationUtils` para validaciones comunes

**Ejemplo:**
```typescript
// lib/application/services/wallet-service.ts
import { ValidationUtils } from "../utils/validation"
import { CurrencyConverterService } from "./currency-converter-service"

export class WalletService {
  constructor(
    private walletRepo: WalletRepository = new SupabaseWalletRepository(),
    private currencyConverter: CurrencyConverterService = new CurrencyConverterService()
  ) {}

  async getWallet(characterId: string): Promise<WalletData> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.walletRepo.getByCharacterIdWithRetry(characterId)
  }
}
```

**Reglas:**
- ✅ Puede importar de `domain` (si existe)
- ✅ Puede usar otros servicios
- ✅ Define interfaces que `infrastructure` implementará
- ❌ NO puede importar de `infrastructure` directamente (solo interfaces)
- ❌ NO puede importar de `presentation`

**Utilidades:**
- `lib/application/utils/validation.ts` - `ValidationUtils` para validaciones comunes

---

### 📁 Infrastructure (Acceso a Datos)

**Ubicación:** `lib/infrastructure/`

**Responsabilidad:** Implementa el acceso a datos y servicios externos.

**Contiene:**
- Repositorios (implementaciones concretas: `SupabaseWalletRepository`)
- Manejo de errores (`ErrorService`, `AppError`)
- Clientes de API (Supabase)

**Reglas:**
- ✅ Puede importar de `domain` y `application` (interfaces)
- ✅ Implementa interfaces definidas en `application`
- ❌ NO puede importar de `presentation`

**Ejemplo:**
```typescript
// lib/infrastructure/repositories/wallet-repository.ts
export class SupabaseWalletRepository implements WalletRepository {
  constructor(private supabase = createBrowserClient()) {}
  // Implementación usando Supabase
}
```

---

### 📁 Presentation (UI)

**Ubicación:** `components/`

**Responsabilidad:** Interfaz de usuario.

**Estructura:**
```
components/
├── ui/              # shadcn/ui (componentes base)
├── atoms/           # Componentes básicos del dominio
├── molecules/      # Combinaciones de atoms
├── organisms/      # Componentes complejos
├── features/       # Features completos
└── layouts/        # Layouts
```

**Uso de Servicios:**

**Opción 1: Hook personalizado (recomendado)**
```typescript
import { useServices } from "@/hooks/use-services"

export function MyComponent() {
  const services = useServices()
  const wallet = await services.wallet.getWallet(characterId)
}
```

**Opción 2: Instanciación directa**
```typescript
import { WalletService } from "@/lib/application/services"
import { useMemo } from "react"

export function MyComponent() {
  const walletService = useMemo(() => new WalletService(), [])
  const wallet = await walletService.getWallet(characterId)
}
```

**Reglas:**
- ✅ Puede importar de `application` (servicios)
- ✅ Puede importar de `infrastructure` (solo para inicialización)
- ❌ NO debe tener lógica de negocio (debe estar en `application`)
- ❌ NO debe hacer queries directas a Supabase (usar repositorios)

---

## Estructura de Páginas y Navegación (Next.js App Router)

### ⚠️ Regla Estricta: NO usar Tabs para Navegación

**❌ PROHIBIDO:** Usar componentes `<Tabs>` para navegar entre features principales.

**✅ OBLIGATORIO:** Cada feature principal debe ser una página separada en Next.js App Router.

**Razones:**
1. **Mejora la navegabilidad**: URLs compartibles, botón atrás funciona correctamente
2. **Facilita el mantenimiento**: Código más claro y separado por responsabilidades
3. **Permite deep linking**: Puedes llamar sitios desde otros con URLs específicas
4. **Mejor UX**: El usuario puede marcar páginas específicas, compartir enlaces directos

### Estructura de Rutas

**Ubicación:** `app/(app)/`

Cada feature principal debe tener su propia ruta:

```
app/(app)/
├── dashboard/
│   └── page.tsx              # Dashboard principal
├── characters/
│   └── [characterId]/
│       ├── page.tsx          # Overview del personaje
│       ├── inventory/
│       │   ├── page.tsx      # Lista de items
│       │   ├── add/
│       │   │   └── page.tsx  # Agregar item
│       │   └── equipped/
│       │       └── page.tsx  # Vista equipado
│       ├── wallet/
│       │   └── page.tsx      # Monedero
│       ├── movements/
│       │   └── page.tsx      # Movimientos
│       └── sheet/
│           └── page.tsx      # Hoja de personaje
└── campaigns/
    └── [campaignId]/
        ├── page.tsx          # Overview de campaña
        ├── characters/
        │   └── [characterId]/
        │       ├── page.tsx  # Overview del personaje en campaña
        │       ├── wallet/
        │       │   └── page.tsx
        │       ├── inventory/
        │       │   └── page.tsx
        │       └── movements/
        │           └── page.tsx
        ├── locations/
        │   └── page.tsx
        └── npcs/
            └── page.tsx
```

### Navegación

**Usar `<Link>` de Next.js para navegación:**
```typescript
import Link from "next/link"

<Link href={`/campaigns/${campaignId}/characters/${characterId}/wallet`}>
  Ver Monedero
</Link>
```

**Usar `router.push()` para navegación programática:**
```typescript
import { useRouter } from "next/navigation"

const router = useRouter()
router.push(`/campaigns/${campaignId}/characters/${characterId}/inventory`)
```

**❌ NO usar estado local para cambiar vistas:**
```typescript
// ❌ INCORRECTO
const [activeTab, setActiveTab] = useState("wallet")
{activeTab === "wallet" && <WalletView />}

// ✅ CORRECTO
// Cada vista es una página separada con su propia ruta
```

### Relación entre Features y Páginas

- **`components/features/`**: Componentes reutilizables de features
- **`app/(app)/.../page.tsx`**: Páginas que usan esos componentes

**Ejemplo:**
```typescript
// app/(app)/campaigns/[campaignId]/characters/[characterId]/wallet/page.tsx
import { WalletView } from "@/components/features/wallet"

export default function WalletPage({ params }: { params: Promise<{ campaignId: string, characterId: string }> }) {
  const { campaignId, characterId } = await params
  return <WalletView characterId={characterId} campaignId={campaignId} />
}
```

---

## Hooks Personalizados para Features

### Patrón de Hooks para Features

Cuando un feature tiene lógica compleja compartida entre múltiples componentes, crear un hook personalizado.

**Ubicación:** `components/features/[feature]/use-[feature]-data.tsx`

**Ejemplo:**
```typescript
// components/features/inventory/use-inventory-data.tsx
export function useInventoryData(characterId: string) {
  const services = useServices()
  // Estado, handlers, funciones helper
  return { items, handleAdd, handleEquip, ... }
}
```

**Uso en componentes:**
```typescript
// En cualquier componente del feature
import { useInventoryData } from "@/components/features/inventory"

const { items, handleAdd } = useInventoryData(characterId)
```

**Reglas:**
- ✅ Un hook por feature complejo
- ✅ Encapsula toda la lógica de negocio del feature
- ✅ Expone solo lo necesario a los componentes
- ✅ Usa `useServices()` internamente para acceder a servicios
- ❌ NO duplicar lógica en componentes individuales
- ❌ NO debe tener lógica de negocio (debe delegar a servicios)

**Beneficios:**
- Reutilización de lógica entre componentes del mismo feature
- Evita duplicación de código
- Facilita testing y mantenimiento
- Consistencia en el comportamiento del feature

---

## Flujo de Datos Simplificado

```
Usuario → Componente (Presentation)
         ↓
    Servicio (Application) ←→ Otro Servicio
         ↓
    Repositorio (Infrastructure)
         ↓
    Base de Datos (Supabase)
```

**Ejemplo completo:**

1. Usuario hace clic en "Ver Wallet"
2. `FinancesView` (presentation) llama a `services.wallet.getWallet()`
3. `WalletService` (application) valida con `ValidationUtils` y llama a `WalletRepository.getByCharacterId()`
4. `SupabaseWalletRepository` (infrastructure) hace query a Supabase
5. Los datos fluyen de vuelta por las capas
6. `FinancesView` renderiza usando `WalletDisplay` (molecule)

---

## Utilidades Compartidas

### ValidationUtils
**Ubicación:** `lib/application/utils/validation.ts`

Utilidades para validaciones comunes:
- `validateId()` - Valida IDs no vacíos
- `validatePositiveNumber()` - Valida números positivos
- `validateNonNegativeNumber()` - Valida números no negativos
- `validateNonEmptyString()` - Valida cadenas no vacías

**Uso:**
```typescript
import { ValidationUtils } from "@/lib/application/utils/validation"

ValidationUtils.validateId(characterId, "Character ID")
ValidationUtils.validatePositiveNumber(amount, "Amount")
```

### useServices Hook
**Ubicación:** `hooks/use-services.ts`

Hook personalizado para instanciar todos los servicios de una vez.

**Uso:**
```typescript
import { useServices } from "@/hooks/use-services"

const services = useServices()
// services.wallet, services.character, services.inventory, etc.
```

---

## Principios de Diseño

1. **Servicios como Casos de Uso**: Los servicios encapsulan toda la lógica de un caso de uso
2. **Composición sobre Herencia**: Los servicios pueden usar otros servicios
3. **Single Source of Truth**: Una sola fuente para cada concepto (ej: `CurrencyConverterService` para conversiones)
4. **Validación Centralizada**: Usar `ValidationUtils` para validaciones comunes
5. **Separación de Responsabilidades**: Lógica de negocio en servicios, acceso a datos en repositorios

---

## Servicios Principales

### WalletService
- Manejo de wallets de personajes
- Cálculos de totales y conversiones
- Usa `CurrencyConverterService` para conversiones

### CharacterService
- Gestión de personajes
- Validación de propiedad

### InventoryService
- Gestión de inventario
- Equipamiento y contenedores
- Validaciones de slots y capacidad

### MovementService
- Movimientos financieros (add, remove, conversion)
- Usa `CurrencyConverterService` para conversiones

### TransferService
- Transferencias entre personajes
- Validación de fondos
- Actualización de wallets

### CampaignService
- Gestión de campañas
- Miembros y roles
- Códigos de invitación

### CurrencyConverterService
- **Única fuente de verdad** para conversiones de moneda
- Tasas de conversión centralizadas
- Soporte para i18n

---

## Manejo de Errores

### ErrorService
**Ubicación:** `lib/infrastructure/errors/`

Centraliza el manejo de errores y mapea errores de infraestructura a errores de aplicación.

**Uso:**
```typescript
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"

try {
  await walletRepo.getByCharacterId(id)
} catch (error) {
  throw ErrorService.fromSupabaseError(error)
}
```

---

## Estructura de Componentes (Atomic Design)

### Atoms (Componentes Básicos)
**Ubicación:** `components/atoms/`

Componentes mínimos e indivisibles del dominio.

**Ejemplos:**
- `CurrencyBadge` - Badge con icono de moneda
- `CurrencyAmount` - Display de cantidad de moneda
- `CharacterAvatar` - Avatar de personaje

### Molecules (Combinaciones)
**Ubicación:** `components/molecules/`

Combinaciones de atoms que forman unidades funcionales.

**Ejemplos:**
- `WalletDisplay` - Combina CurrencyAmount + Card
- `CharacterCard` - Combina CharacterAvatar + Badges + CurrencyAmount
- `LoadingState` - Estado de carga reutilizable
- `EmptyState` - Estado vacío reutilizable

### Organisms (Componentes Complejos)
**Ubicación:** `components/organisms/`

Componentes complejos que combinan molecules y atoms.

**Ejemplos:**
- `WalletManager` - Gestor completo de wallet
- `InventoryGrid` - Grid de inventario con slots
- `ShoppingCart` - Carrito de compras completo

### Features (Vistas Completas)
**Ubicación:** `components/features/`

Vistas completas de features que combinan organisms, molecules y atoms.

**Ejemplos:**
- `FinancesView` - Vista completa de finanzas
- `InventoryView` - Vista completa de inventario
- `CampaignsView` - Vista completa de campañas

---

## Convenciones de Nombres

### Archivos
- **Servicios:** `*-service.ts` (ej: `wallet-service.ts`)
- **Repositorios:** `*-repository.ts` (ej: `wallet-repository.ts`)
- **Utilidades:** `*.ts` en `lib/application/utils/`
- **Componentes:** `kebab-case.tsx` (ej: `wallet-display.tsx`)

### Clases
- **Servicios:** `*Service` (ej: `WalletService`)
- **Repositorios:** `*Repository` o `Supabase*Repository` (ej: `SupabaseWalletRepository`)
- **Componentes:** `PascalCase` (ej: `WalletDisplay`)

---

## Testing

### Estrategia

1. **Application:** Tests unitarios con mocks de repositorios
2. **Infrastructure:** Tests de integración (opcional)
3. **Presentation:** Tests de componentes (opcional, usar Storybook)

---

## Mejoras Recientes

### ✅ Optimizaciones Implementadas

1. **ValidationUtils**: Validaciones centralizadas para evitar duplicación
2. **CurrencyConverterService como Single Source of Truth**: Todas las conversiones usan el mismo servicio
3. **Hook useServices()**: Simplifica la instanciación de servicios en componentes
4. **Lógica de infraestructura en repositorios**: `CampaignService` ya no accede directamente a Supabase
5. **Composición de servicios**: Los servicios pueden usar otros servicios (ej: `MovementService` usa `CurrencyConverterService`)

---

## Recursos

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Atomic Design](https://atomicdesign.bradfrost.com/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Última actualización:** 2025-01-16  
**Versión:** 2.1.0 (Con estructura de páginas y hooks)
