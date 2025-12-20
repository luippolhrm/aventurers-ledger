-- ============================================================================
-- SCRIPT 060: Función auxiliar para algoritmo de deducción inteligente
-- ============================================================================
-- Esta función calcula cómo deducir monedas del wallet de forma inteligente,
-- priorizando monedas de mayor valor (platinum > gold > electrum > silver > copper)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_wallet_deduction(
  p_total_cost INTEGER,  -- Total a deducir en copper pieces
  p_platinum NUMERIC,
  p_gold NUMERIC,
  p_electrum NUMERIC,
  p_silver NUMERIC,
  p_copper NUMERIC
) RETURNS TABLE (
  new_platinum NUMERIC,
  new_gold NUMERIC,
  new_electrum NUMERIC,
  new_silver NUMERIC,
  new_copper NUMERIC
) AS $$
DECLARE
  v_remaining INTEGER;
  v_platinum_spend INTEGER;
  v_gold_spend INTEGER;
  v_electrum_spend INTEGER;
  v_silver_spend INTEGER;
BEGIN
  -- Inicializar variables
  v_remaining := p_total_cost;
  
  -- Algoritmo de deducción inteligente: priorizar monedas de mayor valor
  
  -- 1. Usar Platinum (1 PP = 1000 CP)
  IF v_remaining >= 1000 AND p_platinum > 0 THEN
    v_platinum_spend := LEAST(FLOOR(v_remaining / 1000)::INTEGER, p_platinum::INTEGER);
    v_remaining := v_remaining - (v_platinum_spend * 1000);
  ELSE
    v_platinum_spend := 0;
  END IF;
  
  -- 2. Usar Gold (1 GP = 100 CP)
  IF v_remaining >= 100 AND p_gold > 0 THEN
    v_gold_spend := LEAST(FLOOR(v_remaining / 100)::INTEGER, p_gold::INTEGER);
    v_remaining := v_remaining - (v_gold_spend * 100);
  ELSE
    v_gold_spend := 0;
  END IF;
  
  -- 3. Usar Electrum (1 EP = 50 CP)
  IF v_remaining >= 50 AND p_electrum > 0 THEN
    v_electrum_spend := LEAST(FLOOR(v_remaining / 50)::INTEGER, p_electrum::INTEGER);
    v_remaining := v_remaining - (v_electrum_spend * 50);
  ELSE
    v_electrum_spend := 0;
  END IF;
  
  -- 4. Usar Silver (1 SP = 10 CP)
  IF v_remaining >= 10 AND p_silver > 0 THEN
    v_silver_spend := LEAST(FLOOR(v_remaining / 10)::INTEGER, p_silver::INTEGER);
    v_remaining := v_remaining - (v_silver_spend * 10);
  ELSE
    v_silver_spend := 0;
  END IF;
  
  -- 5. Usar Copper para el resto
  -- v_remaining ya contiene lo que falta en copper
  
  -- Retornar nuevos valores (asegurando que no sean negativos)
  RETURN QUERY SELECT
    GREATEST(0, p_platinum - v_platinum_spend)::NUMERIC,
    GREATEST(0, p_gold - v_gold_spend)::NUMERIC,
    GREATEST(0, p_electrum - v_electrum_spend)::NUMERIC,
    GREATEST(0, p_silver - v_silver_spend)::NUMERIC,
    GREATEST(0, p_copper - v_remaining)::NUMERIC;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION calculate_wallet_deduction IS 
'Calcula la deducción inteligente de monedas del wallet, priorizando monedas de mayor valor. Retorna los nuevos valores de cada moneda después de la deducción.';

