-- Vincula solicitudes históricas con el paciente real que ya existe en la BD.
-- No crea pacientes: solo usa coincidencia exacta de DNI (único en pacientes).
-- Las solicitudes sin paciente registrado permanecen sin vínculo.
UPDATE "solicitudes_transfusion" AS s
SET "pacienteId" = p."id"
FROM "pacientes" AS p
WHERE s."pacienteId" IS NULL
  AND s."dniPaciente" = p."dni";
