# 🚀 GUÍA DE EJECUCIÓN - FASE 1: Seguridad y Simplificación

## ⚠️ IMPORTANTE: Leer COMPLETAMENTE antes de ejecutar

---

## 📋 Pre-requisitos

✅ Acceso a Supabase Dashboard  
✅ Permisos para ejecutar SQL en la base de datos  
✅ Código actualizado en repositorio local  
✅ No hay datos de producción críticos (confirmado)  

---

## 🎯 ¿Qué vamos a hacer?

1. **Activar RLS** (Row Level Security) en todas las tablas
2. **Simplificar tabla characters** (eliminar 14 columnas, agregar 3 nuevas)
3. **Verificar** que todo funcione correctamente

**Tiempo estimado**: 15-20 minutos

---

## 📝 PASO 1: Abrir Supabase SQL Editor

1. Ve a [https://supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **SQL Editor**
4. Haz click en **"New query"**

---

## 🔒 PASO 2: Ejecutar Script de Seguridad (RLS)

### 2.1 Copiar Script

Abre el archivo: `scripts/035_enable_rls_all_tables.sql`

### 2.2 Pegar en SQL Editor

Copia TODO el contenido del archivo y pégalo en el SQL Editor de Supabase.

### 2.3 Ejecutar

1. Haz click en el botón **"Run"** (o presiona Ctrl/Cmd + Enter)
2. Espera a que termine (debería tomar ~5-10 segundos)

### 2.4 Verificar Éxito

**✅ Si todo salió bien, verás:**
```
Success. No rows returned
```

**❌ Si hay error:**
- Lee el mensaje de error
- Es posible que alguna policy ya exista
- Si dice "policy already exists", es OK - continúa
- Si es otro error, copia el mensaje y pídeme ayuda

---

## ✂️ PASO 3: Ejecutar Script de Simplificación

### 3.1 Copiar Script

Abre el archivo: `scripts/036_simplify_characters_table.sql`

### 3.2 Pegar en NUEVA Query

1. Haz click en **"New query"** para crear una nueva pestaña
2. Copia TODO el contenido del archivo
3. Pégalo en el nuevo SQL Editor

### 3.3 Ejecutar

1. Haz click en el botón **"Run"** (o presiona Ctrl/Cmd + Enter)
2. Espera a que termine (debería tomar ~3-5 segundos)

### 3.4 Verificar Éxito

**✅ Si todo salió bien, verás:**
```
Success. No rows returned
```

**❌ Si hay error:**
- Si dice "column does not exist", probablemente ya se ejecutó antes - es OK
- Si es otro error, copia el mensaje y pídeme ayuda

---

## ✅ PASO 4: Verificar Cambios en la Base de Datos

### 4.1 Verificar RLS Activo

En SQL Editor, ejecuta:
```sql
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Esperado**: Todas las tablas deben tener `rowsecurity = true`

### 4.2 Verificar Políticas Creadas

Ejecuta:
```sql
SELECT 
  tablename, 
  policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Esperado**: Deberías ver ~40 policies

### 4.3 Verificar Columnas de Characters

Ejecuta:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'characters' 
ORDER BY ordinal_position;
```

**Esperado - Columnas que DEBEN existir:**
```
✅ id
✅ user_id
✅ name
✅ race
✅ class
✅ level
✅ alignment
✅ background
✅ experience_points
✅ carrying_capacity       ← NUEVA
✅ preparation_notes       ← NUEVA
✅ avatar_url              ← NUEVA
✅ archived
✅ created_at
✅ updated_at
```

**Columnas que NO deben existir:**
```
❌ strength
❌ dexterity
❌ constitution
❌ intelligence
❌ wisdom
❌ charisma
❌ max_hit_points
❌ current_hit_points
❌ armor_class
❌ speed
❌ initiative_bonus
❌ physical_description
❌ personality_traits
❌ backstory
```

---

## 🧪 PASO 5: Testing de Funcionalidad

### 5.1 Testing en el Navegador

1. Abre tu aplicación local: `http://localhost:3000` (o la URL de dev)
2. Haz login con tu usuario

### 5.2 Test de Seguridad (RLS)

**Test 1: Ver solo tus personajes**
```
1. Ve a "Characters"
2. Deberías ver SOLO tus personajes
3. Si ves personajes de otros usuarios → RLS NO funcionó
```

**Test 2: Crear personaje**
```
1. Click en "Create Character"
2. Llena: Nombre, Raza, Clase, Nivel
3. Click "Save"
4. ✅ Debería crear sin errores
5. ✅ Debería aparecer en la lista
```

### 5.3 Test de Campos Nuevos

**Test 3: Editar personaje**
```
1. Click en "Edit" en un personaje
2. ✅ Deberías ver SOLO 1 tab: "Profile"
3. ❌ NO deberías ver tabs: "Attributes", "Stats", "Narrative"
4. ✅ Deberías ver los campos nuevos:
   - Carrying Capacity
   - Avatar URL
   - Preparation Notes
```

**Test 4: Ver personaje (View Sheet)**
```
1. Click en "View Sheet" en un personaje
2. ✅ Deberías ver info básica
3. ✅ Deberías ver "Carrying Capacity" en Character Details
4. ❌ NO deberías ver secciones de:
   - "Core Attributes"
   - "Combat Stats"
   - "Narrative"
```

**Test 5: Guardar cambios**
```
1. Edita un personaje
2. Cambia "Carrying Capacity" a 200
3. Agrega algo en "Preparation Notes"
4. Click "Update Character"
5. ✅ Debería guardar sin errores
6. Verifica que los cambios se guardaron (vuelve a editar)
```

### 5.4 Test de Finanzas e Inventario

**Test 6: Módulo Finances**
```
1. Ve a "Finances"
2. Intenta agregar dinero
3. ✅ Debería funcionar normalmente
```

**Test 7: Módulo Inventory**
```
1. Ve a "Inventory"
2. Intenta agregar un item
3. ✅ Debería funcionar normalmente
```

### 5.5 Test de Campañas

**Test 8: Crear campaña**
```
1. Ve a "Campaigns"
2. Crea una campaña nueva
3. ✅ Debería crear sin errores
4. ✅ Deberías poder ver el invite code
```

---

## 🐛 PASO 6: Revisión de Errores

### 6.1 Abrir Consola del Navegador

1. Presiona F12 (o Cmd + Option + I en Mac)
2. Ve a la tab "Console"

### 6.2 Buscar Errores

**❌ Errores que indican problemas:**
```javascript
// RLS error - muy grave
"new row violates row-level security policy"

// Campo no existe - script no se ejecutó
"column 'strength' does not exist"
"column 'carrying_capacity' does not exist"

// Permission denied - RLS demasiado restrictivo
"permission denied for table characters"
```

**✅ Si NO ves estos errores → Todo OK**

### 6.3 Testing de RLS con Segundo Usuario (Opcional pero Recomendado)

1. Abre ventana de incógnito
2. Crea un nuevo usuario (o usa uno existente)
3. Crea un personaje con ese usuario
4. Vuelve a tu usuario original
5. ✅ NO deberías ver el personaje del otro usuario

---

## 📊 PASO 7: Checklist Final

Marca cada item cuando lo verifiques:

### Base de Datos
- [ ] Script 035 ejecutado sin errores
- [ ] Script 036 ejecutado sin errores
- [ ] RLS activo en todas las tablas
- [ ] ~40 políticas creadas
- [ ] Tabla characters tiene 15 columnas (no 26)
- [ ] Columnas nuevas existen: carrying_capacity, preparation_notes, avatar_url

### Aplicación
- [ ] Login funciona
- [ ] Puedes crear personajes
- [ ] Solo ves tus propios personajes
- [ ] Editar personaje muestra solo 1 tab (Profile)
- [ ] Campos nuevos aparecen en formulario
- [ ] Guardar cambios funciona
- [ ] View Sheet no muestra secciones eliminadas
- [ ] Finanzas funciona normalmente
- [ ] Inventario funciona normalmente
- [ ] Campañas funcionan normalmente

### Limpieza de Código
- [ ] character-profile.tsx eliminado ✅
- [ ] dashboard-overview.tsx actualizado ✅
- [ ] No hay errores en consola del navegador

---

## ✅ ÉXITO - Todo Listo

**Si todos los checkboxes están marcados:**

🎉 **¡FASE 1 COMPLETADA EXITOSAMENTE!**

Estás listo para continuar con:
- **FASE 2**: Shopping Cart & Búsqueda
- O hacer mejoras adicionales a Fase 1

---

## ❌ Si Algo Salió Mal

### Rollback (Revertir Cambios)

Si necesitas revertir los cambios de seguridad (solo en emergencia):

```sql
-- SOLO SI NECESITAS REVERTIR RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
```

⚠️ **IMPORTANTE**: Solo usa esto en desarrollo. NO desactives RLS en producción.

### Revertir Simplificación de Characters

**No es posible** revertir automáticamente porque los datos de columnas eliminadas se perdieron.

Si necesitas restaurar:
1. Crea las columnas nuevamente manualmente
2. Los datos antiguos se perdieron (por eso se recomienda backup)

---

## 📞 Ayuda

Si encuentras problemas:
1. Copia el error exacto
2. Indica en qué paso estabas
3. Captura de pantalla si es posible
4. Comparte conmigo y te ayudo a resolverlo

---

## 📝 Notas Adicionales

### Traducciones Legacy

**Nota**: El archivo `lib/translations.ts` todavía contiene traducciones para campos eliminados (como "coreAttributes", "combatStats", etc.). 

**¿Es un problema?** No. El código funciona perfectamente.

**¿Deberíamos limpiarlas?** Opcional. Puedes hacerlo después si quieres reducir el tamaño del archivo, pero no es necesario.

### Performance

Después de activar RLS, las queries tienen un overhead minimal debido a las verificaciones de seguridad. Esto es normal y esperado. El impacto es negligible en la mayoría de casos.

Si notas lentitud significativa, puede ser necesario agregar índices. Avísame y lo optimizamos.

---

**Última actualización**: Diciembre 15, 2024  
**Autor**: Asistente AI  
**Fase**: 1 de 4
