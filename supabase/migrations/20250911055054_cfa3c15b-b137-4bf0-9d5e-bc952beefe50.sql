-- Update existing pallet locations according to new section mapping
-- C1, C2, C3 -> A1, A2, A3
-- B1 -> B3
-- A1, A2, A3, A4, A5 -> C1, C2, C3, C4, C5

UPDATE public.pallets 
SET location = CASE 
  -- C sections become A sections
  WHEN location LIKE 'C1-%' THEN REPLACE(location, 'C1-', 'A1-')
  WHEN location LIKE 'C2-%' THEN REPLACE(location, 'C2-', 'A2-')
  WHEN location LIKE 'C3-%' THEN REPLACE(location, 'C3-', 'A3-')
  
  -- B1 becomes B3
  WHEN location LIKE 'B1-%' THEN REPLACE(location, 'B1-', 'B3-')
  
  -- A sections become C sections
  WHEN location LIKE 'A1-%' THEN REPLACE(location, 'A1-', 'C1-')
  WHEN location LIKE 'A2-%' THEN REPLACE(location, 'A2-', 'C2-')
  WHEN location LIKE 'A3-%' THEN REPLACE(location, 'A3-', 'C3-')
  WHEN location LIKE 'A4-%' THEN REPLACE(location, 'A4-', 'C4-')
  WHEN location LIKE 'A5-%' THEN REPLACE(location, 'A5-', 'C5-')
  
  ELSE location
END
WHERE location ~ '^(A[1-5]|B1|C[1-3])-';