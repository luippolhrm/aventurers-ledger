# Future Features - Adventurer's Ledger

Este documento registra ideas y features planeadas para futuras iteraciones del proyecto.

---

## 🔄 Transacciones Entre Jugadores

**Descripción:**
Sistema que permite a los jugadores realizar transacciones económicas entre sí, incluyendo préstamos, intercambios y transferencias de dinero.

**Funcionalidades propuestas:**

### 1. Préstamos de Dinero
- Jugador A puede prestar monedas a Jugador B
- Registro del monto, fecha, y plazo de devolución
- Notificaciones o recordatorios de deuda pendiente
- Historial de préstamos activos y completados

### 2. Intercambios/Trueques
- Intercambio de items por dinero
- Intercambio de items por items
- Sistema de propuesta y aceptación
- Registro del valor de intercambio en oro equivalente

### 3. Transferencias Directas
- Enviar monedas de un jugador a otro
- Registro automático en movimientos de ambos jugadores
- Opción de agregar nota o concepto a la transferencia

### 4. Historial de Transacciones
- Vista completa de todas las transacciones realizadas
- Filtros por tipo (préstamo, intercambio, transferencia)
- Filtros por jugador involucrado
- Exportación de historial

**Cambios en Base de Datos:**

```sql
-- Nueva tabla: transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'loan', 'trade', 'transfer'
  from_character_id UUID REFERENCES characters(id),
  to_character_id UUID REFERENCES characters(id),
  amount_from INTEGER,
  currency_from VARCHAR(2),
  amount_to INTEGER,
  currency_to VARCHAR(2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  due_date TIMESTAMPTZ, -- Para préstamos
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_transactions_from_character ON transactions(from_character_id);
CREATE INDEX idx_transactions_to_character ON transactions(to_character_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
```

**Consideraciones técnicas:**
- Requiere sistema de autenticación para identificar jugadores únicos
- Posible integración con sistema de notificaciones
- Validación de fondos suficientes antes de completar transacción
- Sistema de permisos (¿quién puede ver transacciones de quién?)

**Prioridad:** Media-Alta
**Dependencias:** Sistema de autenticación, múltiples usuarios simultáneos
**Estimación:** 3-5 días de desarrollo

---

## 📦 Gestión de Inventario

**Status:** Pendiente de definición
**Descripción:** Sistema para gestionar items, equipamiento y objetos del personaje.

---

## 📖 Libro de Hechizos (Spellbook)

**Status:** Pendiente de definición
**Descripción:** Gestión de hechizos conocidos, slots disponibles, y preparación de hechizos.

---

## 🎲 Calculadora de Dados

**Status:** Pendiente de definición
**Descripción:** Herramienta para realizar tiradas de dados con diferentes configuraciones (1d20, 2d6+3, etc).

---

## 👥 Master's Portal (Proyecto Separado)

**Status:** Planificado para Fase 2
**Descripción:** Aplicación separada para Game Masters con gestión de campañas, NPCs, encuentros y recompensas para jugadores.

---

## Notas Generales

- Todas las features deben mantener el soporte multi-idioma (EN, ES, FR, PT)
- Diseño debe seguir el sistema actual de shadcn/ui
- Priorizar la experiencia mobile-first
- Mantener sincronización con Supabase para persistencia de datos
