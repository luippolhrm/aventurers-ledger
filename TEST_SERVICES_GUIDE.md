# Guía de Prueba de Servicios y Repositorios

## 📍 Acceso a la Página de Prueba

La página de prueba está disponible en:
```
http://localhost:3000/test-services
```

O en producción:
```
https://tu-dominio.com/test-services
```

---

## 🧪 Servicios que se Pueden Probar

### 1. WalletService
**Requisitos:** Usuario logueado + Personaje activo

**Pruebas incluidas:**
- ✅ `getWallet(characterId)` - Obtiene el wallet del personaje
- ✅ `calculateTotalInCopper(wallet)` - Calcula el total en copper pieces
- ✅ `formatWallet(wallet)` - Formatea el wallet para mostrar

**Qué verificar:**
- El wallet se carga correctamente
- Los cálculos de conversión son correctos
- El formato es legible

---

### 2. CharacterService
**Requisitos:** Usuario logueado

**Pruebas incluidas:**
- ✅ `getUserCharacters(userId)` - Obtiene todos los personajes del usuario
- ✅ `getCharacterById(characterId)` - Obtiene un personaje específico

**Qué verificar:**
- Se listan todos los personajes del usuario
- Se puede obtener un personaje por ID
- Los datos están completos

---

### 3. InventoryService
**Requisitos:** Usuario logueado + Personaje activo

**Pruebas incluidas:**
- ✅ `getInventory(characterId)` - Obtiene todos los items del inventario
- ✅ `calculateTotalWeight(characterId)` - Calcula el peso total
- ✅ `calculateTotalValue(characterId)` - Calcula el valor total
- ✅ `getEquippedItems(characterId)` - Obtiene items equipados

**Qué verificar:**
- Se listan todos los items
- Los cálculos de peso y valor son correctos
- Se identifican correctamente los items equipados

---

### 4. CampaignService
**Requisitos:** Usuario logueado

**Pruebas incluidas:**
- ✅ `getUserCampaigns(userId)` - Obtiene todas las campañas del usuario
- ✅ `getCampaignsAsGM(userId)` - Obtiene campañas donde es GM
- ✅ `getCampaignMembers(campaignId)` - Obtiene miembros de una campaña
- ✅ `validateAccess(userId, campaignId)` - Valida acceso a campaña
- ✅ `isGameMaster(userId, campaignId)` - Verifica si es GM

**Qué verificar:**
- Se listan las campañas correctamente
- Se distinguen campañas como GM vs Player
- Se obtienen los miembros correctamente
- Las validaciones de acceso funcionan

---

## 🚀 Cómo Usar la Página de Prueba

### Paso 1: Iniciar la Aplicación
```bash
npm run dev
# o
pnpm dev
```

### Paso 2: Acceder a la Página
1. Abre tu navegador
2. Ve a `http://localhost:3000/test-services`
3. Asegúrate de estar logueado

### Paso 3: Ejecutar Pruebas

#### Opción A: Probar Todos los Servicios
1. Haz clic en el botón **"Test All Services"**
2. Espera a que se completen todas las pruebas
3. Revisa los resultados

#### Opción B: Probar Servicios Individuales
1. Haz clic en el botón del servicio que quieres probar:
   - **Test WalletService**
   - **Test CharacterService**
   - **Test InventoryService**
   - **Test CampaignService**
2. Revisa los resultados específicos

### Paso 4: Revisar Resultados

Cada prueba muestra:
- ✅ **Estado:** Success, Error, o Pending
- 📝 **Mensaje:** Descripción del resultado
- 📊 **Datos:** JSON con los datos obtenidos (expandible)

---

## 📊 Interpretación de Resultados

### ✅ Success (Verde)
- El servicio funcionó correctamente
- Los datos se obtuvieron/actualizaron correctamente
- Puedes expandir "View Data" para ver los detalles

### ❌ Error (Rojo)
- Hubo un error al ejecutar el servicio
- Revisa el mensaje de error para más detalles
- Puede ser por:
  - Falta de datos (ej: no hay personaje activo)
  - Error de permisos
  - Error de validación
  - Error de conexión

### ⏳ Pending (Gris)
- La prueba está en ejecución
- Aparece brevemente durante la carga

---

## 🔍 Verificación de Datos

### Para ver los datos completos:
1. Haz clic en **"View Data"** en cualquier resultado
2. Se expandirá un panel con el JSON completo
3. Puedes copiar el JSON si necesitas analizarlo

### Datos importantes a verificar:

#### WalletService
```json
{
  "platinum": 0,
  "gold": 100,
  "electrum": 0,
  "silver": 50,
  "copper": 25,
  "total_wealth": 100.75
}
```

#### CharacterService
```json
{
  "id": "uuid",
  "name": "Character Name",
  "race": "Human",
  "class": "Fighter",
  "level": 5
}
```

#### InventoryService
```json
{
  "items": [...],
  "totalWeight": 45.5,
  "totalValue": 5000,
  "equipped": [...]
}
```

#### CampaignService
```json
{
  "campaigns": [...],
  "gmCampaigns": [...],
  "members": [...],
  "hasAccess": true,
  "isGM": false
}
```

---

## 🐛 Solución de Problemas

### Error: "User not logged in"
**Solución:** Inicia sesión en la aplicación primero

### Error: "No active character selected"
**Solución:** Selecciona un personaje activo desde el selector en el header

### Error: "Campaign not found"
**Solución:** Asegúrate de tener campañas creadas o que el ID sea correcto

### Error: "Item not found"
**Solución:** Asegúrate de tener items en el inventario del personaje activo

### Error: "Access denied"
**Solución:** Verifica los permisos RLS en Supabase

---

## 📝 Notas Importantes

1. **Datos Reales:** Las pruebas usan datos reales de tu base de datos
2. **No Modifica:** Las pruebas de lectura NO modifican datos
3. **Permisos:** Asegúrate de tener los permisos correctos en Supabase
4. **RLS:** Las políticas RLS pueden afectar los resultados

---

## 🎯 Próximos Pasos

Después de verificar que todos los servicios funcionan:

1. ✅ **Refactorizar componentes** para usar los servicios
2. ✅ **Agregar tests unitarios** para los servicios
3. ✅ **Optimizar consultas** si es necesario
4. ✅ **Agregar más validaciones** según sea necesario

---

**Fecha de creación:** 2025-01-05  
**Última actualización:** 2025-01-05

