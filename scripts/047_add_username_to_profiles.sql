-- ============================================================================
-- SCRIPT 047: Agregar campo username a profiles
-- ============================================================================
-- Purpose: Agregar campo username único para identificar usuarios y permitir
--          búsqueda de usuarios para enviar invitaciones
-- ============================================================================

-- Agregar columna username a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Crear índice único para username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
ON profiles(username) 
WHERE username IS NOT NULL;

-- Migrar datos existentes: generar username único para cada perfil
-- Primero crear la función antes de usarla

-- Función para generar username único basado en email o display_name
CREATE OR REPLACE FUNCTION generate_unique_username(email TEXT, display_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Intentar generar desde email primero
  IF email IS NOT NULL AND email != '' THEN
    base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9]', '', 'g'));
  END IF;
  
  -- Si no hay email o está vacío, usar display_name
  IF base_username IS NULL OR base_username = '' THEN
    IF display_name IS NOT NULL AND display_name != '' THEN
      base_username := LOWER(REGEXP_REPLACE(display_name, '[^a-z0-9]', '', 'g'));
    END IF;
  END IF;
  
  -- Si aún está vacío, usar "user"
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;
  
  -- Verificar si ya existe y agregar número si es necesario
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Función legacy para compatibilidad (usa solo email)
CREATE OR REPLACE FUNCTION generate_username_from_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN generate_unique_username(email, NULL);
END;
$$ LANGUAGE plpgsql;

-- Actualizar trigger para auto-generar username en signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- Generar username único
  new_username := generate_username_from_email(NEW.email);
  
  INSERT INTO public.profiles (id, display_name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    new_username,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Actualizar profiles existentes que no tienen username
-- Usar la función mejorada que maneja email y display_name
DO $$
DECLARE
  profile_record RECORD;
  new_username TEXT;
BEGIN
  FOR profile_record IN 
    SELECT p.id, p.display_name, au.email
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE p.username IS NULL
  LOOP
    -- Generar username único usando la función mejorada
    new_username := generate_unique_username(profile_record.email, profile_record.display_name);
    
    -- Actualizar el profile
    UPDATE profiles
    SET username = new_username
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que todos los profiles tienen username
SELECT 
  'Profiles sin username' as status,
  COUNT(*) as count
FROM profiles
WHERE username IS NULL;

-- Verificar que no hay duplicados
SELECT 
  'Usernames duplicados' as status,
  COUNT(*) as count
FROM (
  SELECT username, COUNT(*) 
  FROM profiles 
  WHERE username IS NOT NULL
  GROUP BY username 
  HAVING COUNT(*) > 1
) duplicates;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Profiles sin username: 0
-- ✅ Usernames duplicados: 0
-- ============================================================================
