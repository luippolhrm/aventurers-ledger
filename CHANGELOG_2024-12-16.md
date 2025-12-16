# 📝 Changelog - Actualizaciones

## 16 de Diciembre, 2024 - Mejora en Búsqueda de Items

### 🔍 Mejora Principal: Sistema de Búsqueda Inteligente

Se implementó un sistema avanzado de búsqueda y filtrado para items en el marketplace, mejorando significativamente la experiencia de usuario al buscar items específicos.

---

### 🎯 Problema Resuelto

Al buscar items como "ring" (anillo), el sistema devolvía resultados irrelevantes que solo mencionaban la palabra en la descripción, en lugar de mostrar los items cuyo nombre contenía la búsqueda.

**Ejemplo del problema:**
- Buscar "ring" devolvía items como "Sword" que solo mencionaban "ring" en su descripción
- No mostraba prioritariamente items como "Ring of Protection" o "Ring of Invisibility"

---

### ✨ Mejoras Implementadas

#### 1. Filtrado Inteligente por Nombre
- El sistema ahora filtra resultados para mostrar **solo items donde el nombre contiene la búsqueda**
- Se ignoran coincidencias que solo aparecen en la descripción del item
- Esto asegura que búsquedas como "ring" muestren anillos (Ring of Protection, Ring of Invisibility) y no items que solo mencionan "ring" en su descripción

#### 2. Sistema de Priorización por Relevancia
Se implementó un sistema de scoring que prioriza resultados:

- **Prioridad Máxima (100 puntos)**: Coincidencia exacta del nombre
  - Ejemplo: Buscar "Ring" devuelve "Ring" primero
  
- **Prioridad Alta (80 puntos)**: Nombre que empieza con la búsqueda
  - Ejemplo: "Ring of..." aparece antes que otros
  
- **Prioridad Media (60 puntos)**: Nombre que contiene la búsqueda
  - Ejemplo: "...Ring..." aparece después
  
- **Prioridad Baja (20 puntos)**: Solo en descripción (filtrado y descartado)

#### 3. Ordenamiento Optimizado
- Los resultados se ordenan primero por **relevancia** (exact matches primero)
- Luego se ordenan **alfabéticamente** para consistencia
- Se devuelven los **50 resultados más relevantes**

#### 4. Optimización de Performance
- Se aumentó el límite inicial de resultados de 20 a 100
- Se realiza filtrado y ordenamiento **client-side** para mejor control
- Mejor balance entre cantidad de resultados y relevancia

---

### 📁 Archivos Modificados

#### `lib/services/item-api-service.ts`
- Método `searchOpen5e()` refactorizado con sistema de scoring
- Filtrado por nombre implementado
- Interfaz `ApiSearchResult` extendida con `relevanceScore` (campo interno para ordenamiento)

**Cambios clave:**
```typescript
// Sistema de scoring implementado
let relevanceScore = 0
if (nameLower === queryLower) {
  relevanceScore = 100 // Exact match
} else if (nameLower.startsWith(queryLower)) {
  relevanceScore = 80 // Starts with query
} else if (nameLower.includes(queryLower)) {
  relevanceScore = 60 // Contains query
} else {
  relevanceScore = 20 // Only in description (filtered out)
}

// Filtrado: solo items donde nombre contiene búsqueda
const nameMatches = mapped.filter((item) => {
  const nameLower = item.name.toLowerCase()
  return nameLower.includes(queryLower)
})
```

---

### 🎮 Impacto en la Experiencia de Usuario

#### Antes
- ❌ Búsquedas imprecisas: "ring" devolvía items irrelevantes
- ❌ Resultados desordenados: items relevantes mezclados con irrelevantes
- ❌ Frustración al buscar items específicos

#### Después
- ✅ **Búsquedas más precisas**: Los usuarios encuentran exactamente lo que buscan
- ✅ **Resultados relevantes primero**: Los items más relevantes aparecen al inicio
- ✅ **Menos frustración**: Ya no aparecen resultados irrelevantes al inicio
- ✅ **Mejor preparación**: Facilita encontrar items específicos para aventuras

---

### 🔧 Detalles Técnicos

#### Flujo de Búsqueda Mejorado

1. **Búsqueda en API**: Se realiza búsqueda en Open5e API con límite de 100 resultados
2. **Mapeo y Scoring**: Cada resultado se mapea y se asigna un score de relevancia
3. **Filtrado por Nombre**: Se filtran solo items donde el nombre contiene la búsqueda
4. **Ordenamiento**: Se ordenan por relevancia (score) y luego alfabéticamente
5. **Limitación**: Se devuelven los 50 resultados más relevantes

#### Interfaz Extendida

```typescript
export interface ApiSearchResult {
  index: string
  name: string
  url: string
  source?: string
  document_slug?: string
  edition?: string
  relevanceScore?: number // Nuevo: para ordenamiento interno
}
```

---

### 📊 Métricas de Mejora

- **Precisión de búsqueda**: Mejorada significativamente (solo items con nombre relevante)
- **Relevancia de resultados**: Priorización inteligente por tipo de coincidencia
- **Experiencia de usuario**: Búsquedas más intuitivas y rápidas

---

### 🚀 Próximos Pasos Sugeridos

1. **Búsqueda multiidioma**: Permitir búsquedas en español que encuentren items en inglés
2. **Búsqueda por sinónimos**: "anillo" → "ring"
3. **Búsqueda fuzzy**: Tolerancia a errores de escritura
4. **Historial de búsquedas**: Recordar búsquedas frecuentes

---

*Changelog actualizado: 16 de Diciembre, 2024*
*Commit: 72b4ced - "Mejora búsqueda de items: filtrado por nombre y priorización por relevancia"*
