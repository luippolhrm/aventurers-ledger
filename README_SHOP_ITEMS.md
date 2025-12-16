# 🏪 Sistema de Gestión de Items de Tiendas

Sistema completo para que los Game Masters puedan agregar items a las tiendas usando tres métodos: manual, IA (Gemini/OpenAI), y APIs públicas.

## 🌟 Características

### 3 Métodos de Creación de Items

1. **📝 Manual**
   - Formulario completo con todos los campos
   - Control total sobre cada propiedad
   - Ideal para items personalizados únicos

2. **🤖 Generación con IA**
   - **Google Gemini** (GRATIS - Recomendado)
   - **OpenAI GPT-4** (Pago - Mejor calidad)
   - Dos modos:
     - **Generar:** Crea items completamente nuevos
     - **Buscar:** Encuentra items oficiales de D&D 5e

3. **🔌 Importar desde APIs**
   - **D&D 5e API:** Contenido SRD oficial
   - **Open5e API:** Items extendidos y third-party
   - Traducción automática a español/francés/portugués

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
pnpm install
```

Esto instalará:
- `openai` - Para OpenAI GPT-4 (opcional)
- `@google/generative-ai` - Para Google Gemini (recomendado)

### 2. Configurar Variables de Entorno

Crea/edita el archivo `.env.local`:

```bash
# Supabase (ya configurado probablemente)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Google Gemini (GRATIS - RECOMENDADO)
GEMINI_API_KEY=AIzaSy...

# OpenAI (OPCIONAL - solo si quieres usarlo)
OPENAI_API_KEY=sk-proj-...
```

#### Obtener API Keys:

**Google Gemini (GRATIS):**
1. Ve a https://aistudio.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Crea una API key
4. Copia y pega en `.env.local`

Ver [GEMINI_SETUP.md](./GEMINI_SETUP.md) para más detalles.

**OpenAI (PAGO):**
1. Ve a https://platform.openai.com/api-keys
2. Crea una API key
3. Copia y pega en `.env.local`
4. Agrega créditos a tu cuenta

### 3. Ejecutar Migración SQL

En tu dashboard de Supabase, ejecuta:

```sql
-- Archivo: scripts/045_expand_shop_items_schema.sql
```

Esto agregará los campos extendidos a la tabla `shop_items`.

### 4. Iniciar el Proyecto

```bash
pnpm dev
```

## 📖 Cómo Usar

### Para Game Masters:

1. **Crear Ubicación**
   - Ve al Mapa
   - Crea una ubicación (puerto, ciudad, etc.)

2. **Crear Tienda**
   - Selecciona la ubicación
   - Crea una tienda

3. **Gestionar Items**
   - Haz clic en "Manage Items"
   - Elige método:
     - **Manual:** Llena el formulario
     - **IA:** Describe el item que quieres
     - **API:** Busca e importa items oficiales

4. **Configurar NPCs** (Opcional)
   - Agrega vendedores a la tienda
   - No son necesarios para que funcione

### Para Jugadores:

1. Ve al Mapa
2. Selecciona una ubicación
3. Selecciona una tienda
4. Selecciona tu personaje
5. ¡Compra items!

## 🎨 Campos de Items

### Básicos
- **Nombre:** Nombre del item
- **Tipo:** Espada larga, Armadura de cuero, etc.
- **Descripción:** Texto descriptivo
- **Categoría:** weapon, armor, potion, scroll, etc.

### Precio e Inventario
- **Precio:** En piezas de cobre (100cp = 1gp)
- **Peso:** En libras
- **Cantidad:** Stock disponible

### Rareza
- Common, Uncommon, Rare, Very Rare, Legendary, Artifact

### Stats de Combate
- **Dados de Daño:** 1d8, 2d6, etc.
- **Tipo de Daño:** slashing, fire, cold, etc.
- **Clase de Armadura:** AC bonus

### Propiedades
- Finesse, Versatile, Heavy, Two-handed, etc.

### Avanzado
- **Requisitos:** "Strength 13 or higher"
- **Sintonización:** Si requiere attunement
- **Imagen:** URL de imagen del item

### Metadata
- **Nombre Original (EN):** Para items traducidos
- **Fuente:** manual, openai, gemini, dnd5eapi, open5e

## 🤖 Uso de IA

### Ejemplos de Prompts

**Generar Nuevo Item:**
```
Una espada larga mágica +1 que brilla con luz azul 
cuando hay orcos cerca. Otorga ventaja en checks de 
Percepción contra orcos.
```

**Buscar Item Oficial:**
```
Longsword
```
```
Ring of Protection
```
```
Potion of Healing
```

### Consejos

- Sé específico en las descripciones
- Menciona rareza deseada
- Incluye propiedades mecánicas
- El sistema calculará el precio automáticamente

## 📊 Costos y Límites

### Google Gemini (GRATIS)
- ✅ 15 requests/minuto
- ✅ 1,500 requests/día
- ✅ ~500-1000 items/mes
- ✅ Siempre gratis

### OpenAI GPT-4 (PAGO)
- 💰 ~$0.01 por item
- 💰 100 items = ~$1.00
- 💳 Requiere tarjeta de crédito
- 🎁 $5 gratis para nuevas cuentas

### APIs Públicas (GRATIS)
- ✅ D&D 5e API: Ilimitado
- ✅ Open5e: Ilimitado
- 💰 Traducción usa tu proveedor de IA elegido

## 🔒 Permisos

- **Game Master:** Puede crear, editar y eliminar items
- **Jugadores:** Solo pueden ver y comprar items

El sistema valida permisos en backend y frontend.

## 🎨 Personalización

### Colores de Rareza

Los items se muestran con badges de color según rareza:
- **Common:** Gris
- **Uncommon:** Verde
- **Rare:** Azul
- **Very Rare:** Púrpura
- **Legendary:** Naranja
- **Artifact:** Rojo

### Visualización

- Imágenes de items (si se proporciona URL)
- Stats de combate destacados
- Propiedades en badges
- Indicador de sintonización

## 🐛 Solución de Problemas

### "GEMINI_API_KEY not configured"

1. Verifica que `.env.local` existe
2. Confirma que la variable está escrita correctamente
3. Reinicia el servidor (`pnpm dev`)

### "No response from AI"

1. Verifica tu API key
2. Revisa límites de rate limiting
3. Intenta con el otro proveedor

### Items no se guardan

1. Verifica que ejecutaste la migración SQL
2. Revisa permisos RLS en Supabase
3. Confirma que eres GM de la campaña

### Traducción no funciona

1. Asegúrate de tener configurada una API key de IA
2. La traducción solo aplica para idiomas != inglés
3. Verifica límites de tu proveedor de IA

## 📚 Archivos Importantes

```
scripts/
  └── 045_expand_shop_items_schema.sql   # Migración SQL

lib/services/
  ├── item-api-service.ts                # APIs D&D
  └── item-ai-providers.ts               # Gemini + OpenAI

app/api/items/
  ├── generate/route.ts                  # Endpoint IA
  └── import/route.ts                    # Endpoint APIs

components/
  ├── shop-items-manager.tsx             # Manager principal
  ├── shop-item-form.tsx                 # Formulario manual
  ├── shop-item-ai-generator.tsx         # Generador IA
  └── shop-item-api-importer.tsx         # Importador APIs

app/shop-items/[shopId]/page.tsx         # Página dedicada
```

## 🤝 Contribuir

Si encuentras bugs o tienes ideas:
1. Abre un issue
2. Describe el problema/idea
3. Incluye pasos para reproducir (si es bug)

## 📄 Licencia

Este proyecto es parte de un sistema de gestión de campañas D&D.

---

¿Preguntas? Lee [GEMINI_SETUP.md](./GEMINI_SETUP.md) para más detalles sobre configuración.
