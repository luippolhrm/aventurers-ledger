# 🚀 Configuración de Google Gemini (GRATIS)

Google Gemini es la alternativa **100% gratuita** a OpenAI para generar items de D&D con IA.

## ✅ Ventajas de Gemini

- ✨ **Completamente GRATIS**
- 🔥 **15 requests por minuto** (tier gratuito)
- 🎯 **1 millón de tokens gratis al mes**
- 💪 **Calidad comparable a GPT-4**
- ⚡ **Más rápido que OpenAI**

## 📝 Cómo Obtener tu API Key (2 minutos)

### 1. Crear cuenta en Google AI Studio

Ve a: https://aistudio.google.com/app/apikey

- Si ya tienes cuenta de Google, simplemente inicia sesión
- Si no, crea una cuenta gratuita

### 2. Obtener la API Key

1. Haz clic en **"Get API Key"** o **"Create API Key"**
2. Selecciona tu proyecto o crea uno nuevo
3. Copia la API key (empieza con `AIza...`)

### 3. Configurar en tu proyecto

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```bash
# Google Gemini (GRATIS - RECOMENDADO)
GEMINI_API_KEY=AIzaSy...tu-key-aqui

# OpenAI (Opcional - Solo si quieres usarlo)
OPENAI_API_KEY=sk-proj-...tu-key-aqui
```

### 4. ¡Listo! 🎉

El sistema usará Gemini por defecto. Puedes cambiar entre Gemini y OpenAI en la interfaz.

## 🔄 Cambiar entre Proveedores

En la interfaz de generación de items verás un selector:

- **Google Gemini** (Free - 15 req/min) ← Por defecto
- **OpenAI GPT-4** (Paid - Better Quality)

Puedes cambiar en cualquier momento.

## 📊 Límites Gratuitos

### Google Gemini (Free Tier)
- ✅ **15 requests por minuto**
- ✅ **1,500 requests por día**
- ✅ **1 millón tokens por mes**
- ✅ **Sin costo** (siempre gratis)

Para este proyecto: **~500-1000 items/mes gratis**

### OpenAI GPT-4 (Comparación)
- 💰 **$0.01 por request** (~50 items = $0.50)
- 💳 **Requiere tarjeta de crédito**
- 📉 **Créditos iniciales: $5** (válidos 3 meses)

## 🛡️ Seguridad de la API Key

**IMPORTANTE:** Nunca compartas tu API key públicamente

✅ **Correcto:**
- Guardar en `.env.local` (ignorado por git)
- Usar variables de entorno

❌ **Incorrecto:**
- Subir a GitHub
- Compartir en Discord/Slack
- Poner en código frontend

El archivo `.env.local` está en `.gitignore` por defecto.

## 🔧 Solución de Problemas

### Error: "GEMINI_API_KEY not configured"

1. Verifica que el archivo `.env.local` existe en la raíz del proyecto
2. Confirma que la variable se llama exactamente `GEMINI_API_KEY`
3. Reinicia el servidor de desarrollo (`pnpm dev`)

### Error: "API key not valid"

1. Ve a https://aistudio.google.com/app/apikey
2. Verifica que la key esté habilitada
3. Genera una nueva key si es necesario
4. Copia y pega cuidadosamente (sin espacios extras)

### Error: "Resource exhausted"

Has alcanzado el límite de requests por minuto (15/min).

**Solución:** Espera 60 segundos e intenta de nuevo.

## 📚 Recursos Adicionales

- **Documentación Gemini:** https://ai.google.dev/docs
- **Consola API:** https://aistudio.google.com/
- **Límites y Precios:** https://ai.google.dev/pricing

## 💡 Recomendación Final

**Usa Gemini como tu proveedor principal** - Es gratis, rápido y excelente para este proyecto.

Solo considera OpenAI si:
- Ya tienes créditos de OpenAI
- Necesitas máxima calidad en descripciones complejas
- Has agotado los límites de Gemini

---

¿Problemas? Revisa que tu `.env.local` se vea así:

```bash
# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Gemini (AGREGAR ESTA LÍNEA)
GEMINI_API_KEY=AIzaSy...
```

¡Y listo! 🚀
