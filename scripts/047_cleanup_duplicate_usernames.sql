-- ============================================================================
-- SCRIPT 047 CLEANUP: Limpiar usernames duplicados
-- ============================================================================
-- Purpose: Limpiar usernames duplicados antes de ejecutar el script principal
--          Ejecutar este script PRIMERO si hay errores de duplicados
-- ============================================================================

-- Primero, crear la función si no existe
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

-- Limpiar todos los usernames duplicados
-- Mantener el primero y regenerar los demás
DO $$
DECLARE
  duplicate_record RECORD;
  new_username TEXT;
  email_val TEXT;
  display_name_val TEXT;
BEGIN
  -- Para cada grupo de duplicados, mantener el primero y regenerar los demás
  FOR duplicate_record IN 
    WITH duplicates AS (
      SELECT id, username, 
             ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn
      FROM profiles
      WHERE username IS NOT NULL
        AND username IN (
          SELECT username
          FROM profiles
          WHERE username IS NOT NULL
          GROUP BY username
          HAVING COUNT(*) > 1
        )
    )
    SELECT p.id, p.username, au.email, p.display_name
    FROM duplicates d
    JOIN profiles p ON p.id = d.id
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE d.rn > 1  -- Mantener el primero (rn = 1), regenerar los demás
  LOOP
    -- Obtener email y display_name
    email_val := duplicate_record.email;
    display_name_val := duplicate_record.display_name;
    
    -- Limpiar el username actual para que la función pueda generar uno nuevo
    UPDATE profiles SET username = NULL WHERE id = duplicate_record.id;
    
    -- Generar nuevo username único
    new_username := generate_unique_username(email_val, display_name_val);
    
    -- Actualizar con el nuevo username
    UPDATE profiles
    SET username = new_username
    WHERE id = duplicate_record.id;
  END LOOP;
END $$;

-- Verificar que no hay duplicados
SELECT 
  'Usernames duplicados después de limpieza' as status,
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
-- ✅ Usernames duplicados después de limpieza: 0
-- ============================================================================
