# 🧪 CHECKLIST DE TESTING - FASE 1

## ✅ Estado: Scripts ejecutados en Supabase - EXITOSO

---

## 🎯 Objetivo del Testing

Verificar que todos los cambios funcionan correctamente ANTES de deployment a producción.

**Tiempo estimado**: 15-20 minutos

---

## 🚀 SETUP: Iniciar Aplicación Local

### 1. Verificar que tienes las dependencias

```bash
# En la raíz del proyecto
npm install
```

### 2. Iniciar servidor de desarrollo

```bash
npm run dev
```

### 3. Abrir en navegador

```
http://localhost:3000
```

### 4. Abrir DevTools (Consola)

Presiona `F12` o `Cmd + Option + I` (Mac)

Ve a la pestaña **Console**

**IMPORTANTE**: Mantén la consola abierta durante TODO el testing para ver si hay errores.

---

## 📋 TESTS OBLIGATORIOS

### ✅ TEST 1: Login / Autenticación

**Objetivo**: Verificar que RLS no rompe el login

- [ ] Ve a la página de login
- [ ] Ingresa con tu usuario
- [ ] ✅ Login exitoso (redirige a dashboard)
- [ ] ❌ Error en consola → Cópialo y pégalo

**Si falla**: Probablemente RLS en `profiles` está demasiado restrictivo

---

### ✅ TEST 2: Ver Personajes (RLS crítico)

**Objetivo**: Verificar que solo ves TUS personajes

- [ ] Ve a **"Characters"** en el menú
- [ ] ✅ Ves tus personajes (si tienes)
- [ ] ❌ No ves ningún personaje (error de RLS)
- [ ] ❌ Ves personajes de otros usuarios (RLS NO funciona!)

**Errores comunes en consola**:
```javascript
// Este es MUY GRAVE:
"new row violates row-level security policy"

// Este también:
"permission denied for table characters"
```

**Si falla**: Hay problema con políticas de `characters` tabla

---

### ✅ TEST 3: Crear Personaje

**Objetivo**: Verificar que puedes crear personajes y que RLS permite INSERT

- [ ] Click en **"Create Character"**
- [ ] Llena el formulario:
  - Name: "Test Character"
  - Race: "Human"
  - Class: "Fighter"
  - Level: 1
- [ ] Click en **"Save"** o **"Create Character"**
- [ ] ✅ Personaje creado exitosamente
- [ ] ✅ Aparece en la lista
- [ ] ❌ Error al crear

**Verificar en consola**: No debe haber errores rojos

**Si falla**: Política de INSERT en `characters` tiene problemas

---

### ✅ TEST 4: Ver Formulario Simplificado

**Objetivo**: Verificar que la UI se actualizó correctamente

- [ ] Click en **"Edit"** en cualquier personaje
- [ ] ✅ Solo ves **1 tab**: "Profile"
- [ ] ❌ Ves más tabs: "Attributes", "Stats", "Narrative" (NO DEBERÍAN EXISTIR)

**Campos que DEBEN aparecer**:
- [ ] ✅ Name
- [ ] ✅ Race
- [ ] ✅ Class
- [ ] ✅ Level
- [ ] ✅ Alignment
- [ ] ✅ Background
- [ ] ✅ Experience Points
- [ ] ✅ **Carrying Capacity** (NUEVO)
- [ ] ✅ **Avatar URL** (NUEVO)
- [ ] ✅ **Preparation Notes** (NUEVO)

**Campos que NO deben aparecer**:
- [ ] ❌ Strength, Dexterity, Constitution (atributos)
- [ ] ❌ Hit Points, Armor Class, Speed
- [ ] ❌ Physical Description, Backstory

**Si falla**: 
- Si ves tabs viejos → El componente no se actualizó (caché de Next.js)
- Solución: Reinicia el servidor (`Ctrl+C` y `npm run dev` de nuevo)

---

### ✅ TEST 5: Editar Personaje con Campos Nuevos

**Objetivo**: Verificar que los campos nuevos se guardan correctamente

- [ ] Click en **"Edit"** en un personaje
- [ ] Cambia **Carrying Capacity** a: `200`
- [ ] Escribe en **Preparation Notes**: `"Comprar pociones de curación"`
- [ ] Escribe en **Avatar URL**: `"https://example.com/avatar.jpg"`
- [ ] Click en **"Update Character"** o **"Save"**
- [ ] ✅ Mensaje de éxito
- [ ] ❌ Error al guardar

**Verificar que se guardó**:
- [ ] Vuelve a editar el mismo personaje
- [ ] ✅ Los valores que escribiste siguen ahí

**Si falla**: 
- Error en consola: `column "carrying_capacity" does not exist` → Script 036 NO se ejecutó
- Error en consola: `permission denied` → RLS demasiado restrictivo

---

### ✅ TEST 6: Ver Personaje (View Sheet)

**Objetivo**: Verificar que la vista de personaje no muestra campos eliminados

- [ ] Click en **"View Sheet"** en cualquier personaje
- [ ] ✅ Ves información básica (nombre, raza, clase, nivel)
- [ ] ✅ Ves "Carrying Capacity" en algún lugar
- [ ] ❌ NO deberías ver secciones de "Combat Stats" o "Attributes"

**Si ves campos viejos**:
- Revisa que `characters-unified.tsx` se actualizó correctamente

---

### ✅ TEST 7: Módulo Finances (RLS en Wallets)

**Objetivo**: Verificar que wallets funcionan con RLS

- [ ] Ve a **"Finances"** en el menú
- [ ] ✅ Ves el wallet de tu personaje
- [ ] Intenta **agregar dinero**:
  - Selecciona moneda: Gold (GP)
  - Cantidad: 100
  - Click "Add"
- [ ] ✅ Dinero agregado correctamente
- [ ] ✅ Balance actualizado
- [ ] ❌ Error al agregar

**Errores comunes**:
```javascript
"permission denied for table wallets"
"permission denied for table movements"
```

**Si falla**: Políticas de `wallets` o `movements` tienen problemas

---

### ✅ TEST 8: Módulo Inventory (RLS)

**Objetivo**: Verificar que inventory funciona con RLS

- [ ] Ve a **"Inventory"** en el menú
- [ ] ✅ Ves tu inventario (si tienes items)
- [ ] Intenta **agregar un item**:
  - Name: "Healing Potion"
  - Type: "Consumable"
  - Quantity: 3
  - Weight: 0.5
  - Value: 50
  - Click "Add Item"
- [ ] ✅ Item agregado correctamente
- [ ] ✅ Aparece en la lista
- [ ] ❌ Error al agregar

**Si falla**: Política de INSERT en `inventory` tiene problemas

---

### ✅ TEST 9: Módulo Campaigns (RLS Complejo)

**Objetivo**: Verificar que campaigns funcionan con RLS

#### 9.1 Crear Campaña (Como GM)

- [ ] Ve a **"Campaigns"** en el menú
- [ ] Click en **"Create Campaign"**
- [ ] Llena:
  - Name: "Test Campaign"
  - Description: "Testing RLS"
- [ ] Click **"Create"**
- [ ] ✅ Campaña creada exitosamente
- [ ] ✅ Aparece en "Campaigns as Game Master"
- [ ] ✅ Ves el invite code

#### 9.2 Ver Campañas

- [ ] ✅ Ves tus campañas como GM
- [ ] ✅ Ves campañas donde eres jugador (si tienes)
- [ ] ❌ NO deberías ver campañas de otros usuarios

**Si falla**: 
- Error: `permission denied for table campaigns` → Política de campaigns
- Error: `permission denied for table campaign_members` → Política de members

---

### ✅ TEST 10: Módulo Marketplace (RLS en Locations/Shops)

**Objetivo**: Verificar que marketplace funciona con RLS

- [ ] Ve a **"Marketplace"** en el menú
- [ ] ✅ Puedes ver el marketplace
- [ ] Si tienes campañas con shops:
  - [ ] ✅ Ves las locations
  - [ ] ✅ Ves las shops
  - [ ] ✅ Ves los items en las shops
- [ ] ❌ Error al cargar

**Si falla**: Políticas de `locations`, `shops`, o `shop_items` tienen problemas

---

### ✅ TEST 11: Navegación General

**Objetivo**: Verificar que toda la navegación funciona

- [ ] Dashboard → ✅ Funciona
- [ ] Characters → ✅ Funciona
- [ ] Finances → ✅ Funciona
- [ ] Inventory → ✅ Funciona
- [ ] Campaigns → ✅ Funciona
- [ ] Marketplace → ✅ Funciona
- [ ] Currency Converter → ✅ Funciona

**Si alguna ruta falla**: Anota cuál y el error

---

### ✅ TEST 12: Consola Limpia (CRÍTICO)

**Objetivo**: Verificar que NO hay errores en la consola

- [ ] Revisa la consola del navegador (DevTools)
- [ ] ✅ **NO hay errores rojos** relacionados con:
  - "permission denied"
  - "row-level security"
  - "column does not exist"
  - "undefined property"
- [ ] ⚠️ Warnings amarillos son OK (generalmente)

**Si hay errores**:
- Copia TODO el error
- Anota en qué página/acción apareció
- Compártelo conmigo

---

## 🧪 TESTS AVANZADOS (Opcionales pero Recomendados)

### ✅ TEST A: Multi-usuario (RLS Aislamiento)

**Solo si tienes 2 usuarios de prueba**:

1. Usuario 1: Crea un personaje "Hero A"
2. Usuario 2: Login con otro usuario
3. Usuario 2: Ve a Characters
4. ✅ **NO debe ver "Hero A"** (personaje del Usuario 1)
5. ❌ Si ve personajes de otro usuario → **RLS FALLÓ**

**Este es el test MÁS CRÍTICO de seguridad**

---

### ✅ TEST B: Transfer entre Personajes

**Si tienes 2+ personajes**:

1. Ve a Finances
2. Intenta hacer una transferencia entre personajes
3. ✅ Transfer funciona
4. ✅ Ambos wallets se actualizan
5. ❌ Error en transfer

---

### ✅ TEST C: Shopping (Compra de Items)

**Si tienes una campaña con shop**:

1. Ve a Marketplace
2. Encuentra un item en una shop
3. Intenta comprarlo
4. ✅ Compra exitosa
5. ✅ Dinero se deduce del wallet
6. ✅ Item aparece en inventory

---

## 📊 RESUMEN FINAL

### Criterio de Éxito

Marca **TODOS** los tests principales (1-12):

- [ ] TEST 1: Login ✅
- [ ] TEST 2: Ver Personajes ✅
- [ ] TEST 3: Crear Personaje ✅
- [ ] TEST 4: Formulario Simplificado ✅
- [ ] TEST 5: Editar con Campos Nuevos ✅
- [ ] TEST 6: View Sheet ✅
- [ ] TEST 7: Finances ✅
- [ ] TEST 8: Inventory ✅
- [ ] TEST 9: Campaigns ✅
- [ ] TEST 10: Marketplace ✅
- [ ] TEST 11: Navegación ✅
- [ ] TEST 12: Consola Limpia ✅

### ✅ SI TODOS LOS TESTS PASAN

**¡FELICIDADES! 🎉**

Estás listo para:
1. Hacer commit a Git
2. Deploy a producción (si quieres)
3. Continuar con Fase 2

### ❌ SI ALGÚN TEST FALLA

**NO CONTINÚES - Arreglemos primero**

1. Anota qué test falló
2. Copia el error de la consola
3. Dime qué pasó
4. Lo arreglaremos juntos

---

## 📝 Formato de Reporte

Si encuentras problemas, usa este formato:

```
TEST FALLIDO: [Número y nombre del test]
ACCIÓN: [Qué estabas haciendo]
ERROR EN CONSOLA: [Copia el error exacto]
COMPORTAMIENTO: [Qué pasó vs qué esperabas]
```

**Ejemplo**:
```
TEST FALLIDO: TEST 3 - Crear Personaje
ACCIÓN: Click en "Save" después de llenar formulario
ERROR EN CONSOLA: "permission denied for table characters"
COMPORTAMIENTO: Apareció error, personaje no se creó
```

---

## 🎯 Próximos Pasos Después del Testing

### Si TODO está OK:

1. **Commit a Git**:
   ```bash
   git add .
   git commit -m "feat: Fase 1 completada - RLS activado y characters simplificado"
   git push origin main
   ```

2. **Deploy a Producción** (si aplica)

3. **Continuar con Fase 2**

### Si HAY ERRORES:

1. Reporta los errores
2. Arreglamos juntos
3. Re-testing
4. Después continuamos

---

## 💡 Tips de Testing

- **Toma tu tiempo**: No apresures los tests
- **Usa datos reales**: Crea personajes reales para probar mejor
- **Consola siempre abierta**: F12 durante todo el testing
- **Anota TODO**: Cualquier cosa extraña, anótala

---

**¿Listo para comenzar el testing?** 🚀

Ejecuta:
```bash
npm run dev
```

Y marca cada checkbox mientras pruebas.
