-- ============================================================================
-- SCRIPT 041: Fix campaign_members RLS by dropping ALL policies
-- ============================================================================
-- Purpose:
--   Eliminar cualquier policy recursiva existente en campaign_members
--   (causa: 42P17 infinite recursion) y recrear policies seguras.
--
-- Run in Supabase SQL Editor.
-- ============================================================================

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaign_members', pol.policyname);
  END LOOP;
END $$;

-- SELECT: miembros ven su propia membresía.
-- IMPORTANT: mantener esta policy SIN JOINS/EXISTS a otras tablas para evitar
-- el loop de RLS: campaign_members -> campaigns -> campaign_members.
CREATE POLICY "campaign_members_select"
  ON public.campaign_members FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- INSERT: un usuario puede insertarse a sí mismo (join) o el GM podría manejarlo vía lógica de app.
CREATE POLICY "campaign_members_insert"
  ON public.campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: un usuario puede salir (borrar su fila)
CREATE POLICY "campaign_members_delete_own"
  ON public.campaign_members FOR DELETE
  USING (user_id = auth.uid());

-- Nota: si más adelante quieres que el GM pueda listar/remover miembros de sus campañas,
-- eso se implementa mejor vía RPC (SECURITY DEFINER) o una policy en una vista, para
-- evitar recursión. Por ahora mantenemos campaign_members sin dependencia a campaigns.

-- Sanity check
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'campaign_members'
ORDER BY policyname;
