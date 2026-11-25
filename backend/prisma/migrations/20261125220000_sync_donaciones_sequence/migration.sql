-- Sincroniza la secuencia de IDs de donaciones con los registros existentes.
-- Los datos iniciales se insertaron con IDs explícitos, por lo que la secuencia
-- quedó en 1 y cualquier alta nueva fallaba con P2002 (donaciones_pkey).
-- Es idempotente: si la tabla está vacía, el próximo ID será 1.
SELECT setval(
  pg_get_serial_sequence('donaciones', 'id'),
  GREATEST(COALESCE((SELECT MAX(id) FROM donaciones), 1), 1),
  EXISTS (SELECT 1 FROM donaciones)
);
