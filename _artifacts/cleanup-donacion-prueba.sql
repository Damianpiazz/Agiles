SELECT COUNT(*) AS entrevistas_asociadas
FROM "entrevistas_pre_donacion"
WHERE "donacionId" = 61;

DELETE FROM "donaciones" WHERE id = 61 RETURNING id, "donanteId";

SELECT COUNT(*) AS total_donaciones FROM "donaciones";
SELECT last_value AS secuencia FROM donaciones_id_seq;
