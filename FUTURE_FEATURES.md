# Product Backlog — Aventurer's Ledger

Este documento es la fuente de verdad del estado del producto: qué está construido,
qué está parcialmente implementado, y qué queda pendiente. Se mantiene actualizado
conforme avanza el desarrollo.

**Última revisión:** Marzo 2026

---

## Leyenda de estado

| Estado | Significado |
|--------|-------------|
| ✅ Implementado | Funcionalidad completa y en producción |
| ⚠️ Parcial | Existe pero con brechas conocidas documentadas |
| 🔲 Pendiente | No iniciado o solo planificado |

---

## ✅ MÓDULOS IMPLEMENTADOS

### Autenticación y Sesión

**Status:** ✅ Implementado

- Registro con email/contraseña (Supabase Auth)
- Login y logout con redirección
- Protección de rutas (`ProtectedRoute`) para toda la app autenticada
- Contexto de sesión disponible globalmente (`useAuth`)
- Gestión de perfil de usuario (nombre, avatar, etc.)
- Ajustes de la aplicación

---

### Hoja de Personaje

**Status:** ✅ Implementado

- Creación de personaje con campos básicos (nombre, clase, nivel, raza, género)
- Soporte doble sistema de reglas: **PHB 2024** y **PHB 2014**
- Los seis atributos clásicos con modificadores calculados automáticamente
- Selección de especie/raza con linajes (Elfos: Alto, Drow, Bosque; Tieflings, Enanos, etc.)
- Rasgos raciales con efectos reales: capacidad de carga, velocidad, visión, descuentos en tienda
- Trasfondo (Background) con bonificaciones de atributo configurables
- Origin Feats (Dotes de Origen PHB 2024) en nivel 1
- Archivado y desarchivado de personajes sin borrar datos
- Notas del personaje con historial de cambios
- Vista de resumen y vista de edición separadas

---

### Inventario

**Status:** ✅ Implementado

- 11 slots corporales: cabeza, cuello, hombros, cuerpo, manos, cintura, 2 anillos, pies, arma principal, arma secundaria
- 3 contenedores: mochila, bolsa izquierda, bolsa derecha
- Categorías de ítem: arma, armadura, equipo, objeto maravilloso, consumible, herramienta, munición, otros
- Soporte para armas versátiles (uso a 1 o 2 manos)
- Validación de capacidad máxima de cada contenedor (en lbs)
- Cálculo de peso total del inventario
- Vista de equipamiento activo y vista de inventario completo
- Añadir, editar y eliminar ítems

---

### Economía — Cartera y Movimientos

**Status:** ✅ Implementado

- Las 5 divisas de D&D: Cobre (CP), Plata (SP), Electro (EP), Oro (GP), Platino (PP)
- Saldo actual con totalizador en GP
- Historial completo de movimientos (ingresos y gastos)
- Conversión de moneda entre divisas con tasas oficiales
- Transferencias directas entre personajes:
  - Validación de fondos suficientes antes de transferir
  - Registro automático en el historial de ambos personajes
  - Campo de descripción/concepto opcional

---

### Campañas

**Status:** ✅ Implementado

- Creación de campaña con nombre, descripción y estado (activa/pausada/terminada)
- Código de invitación único generado automáticamente por campaña
- Flujo para unirse a una campaña con código e indicar qué personaje se lleva
- Roles diferenciados dentro de la campaña: Game Master y Jugador
- Un usuario puede ser GM de una campaña y jugador de otra simultáneamente
- Vista diferenciada según rol (GM ve todo, jugador ve lo suyo)
- Gestión de miembros: el GM puede ver todos los jugadores y sus personajes
- Ajustes de campaña (nombre, descripción, estado)

---

### Portal del Game Master — Construcción del Mundo

**Status:** ✅ Implementado (integrado en la app principal, no como app separada)

**Ubicaciones:**
- Crear y editar ubicaciones dentro de una campaña
- Tipos de ubicación: ciudad, punto de interés, dungeon
- Cada ubicación puede contener tiendas y/o un dungeon

**Tiendas:**
- Crear tiendas dentro de una ubicación
- Gestionar catálogo de ítems con nombre, precio, descripción y stock
- Descuentos automáticos por raza del comprador (basados en rasgos raciales)

**Mazmorras:**
- Crear un dungeon asociado a una ubicación de tipo "dungeon"
- Añadir y editar salas (rooms) con nombre, descripción y contenido
- Validación: solo se puede crear un dungeon en ubicaciones de tipo correcto

**NPCs:**
- Crear NPCs asociados a una tienda o a una sala de dungeon
- Los NPCs tienen inventario y cartera propios (mismos servicios que los personajes)
- Vista de loot del NPC para el GM

---

### Comercio — Carrito y Checkout

**Status:** ✅ Implementado

- Los jugadores acceden al catálogo de una tienda desde la vista de campaña
- Añadir ítems al carrito, modificar cantidades y vaciar el carrito
- Checkout con validación de fondos en tiempo real
- Si los fondos son insuficientes, el checkout falla con mensaje de error
- Al completar la compra: el dinero se descuenta de la cartera y los ítems se añaden al inventario
- Descuento racial aplicado automáticamente en el precio final

---

### Dashboard

**Status:** ✅ Implementado

- Vista de inicio tras el login
- Resumen de campañas donde el usuario es GM (con número de miembros)
- Resumen de campañas donde participa como jugador (con personaje asignado)
- Acceso rápido a personajes libres (sin campaña asignada)
- Navegación directa a cada recurso

---

## ⚠️ MÓDULOS PARCIALMENTE IMPLEMENTADOS

### Capacidad de Carga (Enforcement)

**Status:** ⚠️ Parcial — display informativo implementado, enforcement pendiente

**Qué funciona:**
- Cálculo correcto de `carrying_capacity` = `FUE × 15`, ajustado por tamaño y rasgos raciales
- El campo se recalcula automáticamente al cambiar Fuerza, tamaño o rasgos del personaje
- Widget visual en la pestaña "Resumen" del inventario con barra de progreso y 4 estados (ligero / medio / pesado / sobrecargado)
- Validación de capacidad interna de cada contenedor (mochila, bolsas)

**Qué falta:**
- `InventoryService.createItem()` no valida si el nuevo ítem excede la `carrying_capacity` total del personaje (se puede añadir peso ilimitado sin bloqueo)
- Si el personaje se creó sin Fuerza definida, `carrying_capacity` queda `null` y el widget no aparece
- La penalización de "velocidad reducida a 5 pies" es solo texto cosmético, sin efecto en el sistema

**Referencia técnica:** `lib/application/services/inventory-service.ts`, `lib/services/character-sheet-config.ts:276`

**Prioridad:** Media | **Estimación:** 1-2 días

---

### Transferencias Entre Personajes

**Status:** ⚠️ Parcial — transferencias directas implementadas, préstamos y trueques pendientes

**Qué funciona:**
- Transferencia directa de moneda de un personaje a otro
- Validación de fondos antes de ejecutar
- Historial de transferencias recibidas y enviadas

**Qué falta:**
- Préstamos con fecha de vencimiento y recordatorios
- Sistema de intercambio/trueque (ítem por ítem, ítem por moneda)
- Mecanismo de propuesta y aceptación bidireccional
- Filtros en el historial de transacciones (por tipo, por personaje)

**Prioridad:** Media | **Estimación:** 3-4 días (solo préstamos y trueques)

---

### Dotes (Feats) — PHB 2024

**Status:** ⚠️ Parcial — Origin Feats implementados, el resto en arquitectura únicamente

**Qué funciona:**
- Origin Feats (Dotes de Origen, nivel 1): selección, almacenamiento y efectos
- Arquitectura preparada en `FeatService` para los 4 tipos de feats

**Qué falta:**
- General Feats (niveles 4, 8, 12, 16, 19): tipos definidos, sin datos ni UI
- Combat Style Feats: tipos definidos, sin datos ni UI
- Epic Boons (niveles altos): tipos definidos, sin datos ni UI

**Prioridad:** Media-Alta | **Estimación:** 3-5 días

---

## 🔲 MÓDULOS PENDIENTES

### Libro de Hechizos (Spellbook)

**Status:** 🔲 Pendiente — sin ninguna implementación

**Descripción:**
Gestión de hechizos conocidos por el personaje: slots de hechizo por nivel, preparación diaria,
lanzamiento y recuperación de slots tras descanso.

**Alcance propuesto:**
- Lista de hechizos conocidos/preparados por clase y nivel del personaje
- Contador de slots disponibles y usados por nivel (1-9)
- Registro de descanso corto/largo para recuperar slots
- Buscador de hechizos con filtros (clase, nivel, escuela)

**Dependencias:** Requiere base de datos de hechizos D&D (SRD 5.1 o PHB 2024)
**Prioridad:** Alta (es una de las carencias más notables para jugadores de caster)
**Estimación:** 5-8 días

---

### Calculadora de Dados

**Status:** 🔲 Pendiente — sin ninguna implementación

**Descripción:**
Herramienta integrada para tirar dados con notación estándar (1d20, 2d6+3, etc.),
historial de tiradas y soporte para tiradas con ventaja/desventaja.

**Alcance propuesto:**
- Interfaz de tirada rápida con atajos para d4, d6, d8, d10, d12, d20
- Soporte para expresiones complejas con modificadores
- Ventaja/desventaja (tira 2d20, muestra ambos, aplica el mayor/menor)
- Historial de tiradas de la sesión
- Opción de tirada secreta para el GM

**Prioridad:** Media
**Estimación:** 2-3 días

---

### Combate y Gestión de Encuentros

**Status:** 🔲 Pendiente — sin ninguna implementación

**Descripción:**
Sistema para gestionar la mecánica de combate en tiempo real: iniciativa, puntos de vida,
condiciones y turnos.

**Alcance propuesto:**
- Tracker de iniciativa con orden de turno (personajes + NPCs)
- Gestión de puntos de vida actuales / máximos / temporales por combatiente
- Registro de condiciones (aturdido, paralizado, envenenado, etc.)
- Notificación al jugador cuando es su turno
- Resumen del encuentro al finalizar (daño recibido, enemigos derrotados)

**Dependencias:** Requiere sistema de notificaciones en tiempo real
**Prioridad:** Alta
**Estimación:** 7-10 días

---

### Notificaciones en Tiempo Real

**Status:** 🔲 Pendiente — sin ninguna implementación

**Descripción:**
Sistema de alertas para mantener a los jugadores informados de eventos relevantes
durante la campaña sin necesidad de recargar la página.

**Alcance propuesto:**
- Notificación cuando el GM añade o modifica una ubicación o tienda
- Alerta cuando otro personaje envía una transferencia
- Aviso de turno en combate
- Canal de mensajes sencillo dentro de la campaña (chat de mesa)

**Dependencias:** Supabase Realtime (ya disponible en el stack)
**Prioridad:** Media-Alta (desbloquea otras funcionalidades como combate)
**Estimación:** 3-4 días

---

### Asistente de IA

**Status:** 🔲 Pendiente — dependencias instaladas, sin implementación visible

Las librerías `@google/generative-ai` y `openai` están instaladas pero no hay
ninguna funcionalidad activa que las use.

**Usos propuestos:**
- Generación automática de descripción de NPC (nombre, personalidad, trasfondo)
- Sugerencia de loot basado en el nivel del grupo y el tipo de dungeon
- Asistente de reglas: responde preguntas sobre D&D 5e/2024 en contexto
- Generación de nombre y descripción de sala de mazmorra

**Prioridad:** Baja-Media (valor diferencial, no bloqueante)
**Estimación:** 3-5 días por caso de uso

---

## Notas de Producto

- El stack (Next.js, Supabase, Tailwind, shadcn) está bien posicionado para escalar a tiempo real con Supabase Realtime sin cambios de infraestructura.
- El soporte multi-idioma está parcialmente preparado (hay archivos `translations.ts` y `texts.ts`) pero en la práctica la app está en español. Si se quiere internacionalizar, requiere un audit completo de literales.
- La app funciona en mobile gracias al layout responsive, pero no hay PWA ni modo offline.
- Los módulos de combate y notificaciones están interrelacionados; conviene implementarlos juntos o en orden (notificaciones → combate).
