import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../config/prisma";

export class DonacionNoEncontradaError extends Error {
constructor() {
super(
"La donación no existe. Debe registrarse antes de iniciar la calificación biológica.",
);
this.name = "DonacionNoEncontradaError";
}
}

export class DonacionBloqueadaError extends Error {
constructor() {
super("La donación está bloqueada por resultados reactivos y requiere revisión.");
this.name = "DonacionBloqueadaError";
}
}

type CalificacionDb = {
donacion: {
findUnique(args: { where: { id: number } }): Promise<{ id: number; estado: string } | null>;
};
calificacionBiologica: {
findUnique(args: { where: { donacionId: number } }): Promise<any>;
create(args: { data: { donacionId: number; operador: string; estado: string } }): Promise<any>;
};
};

const dbPredeterminada = prisma as unknown as CalificacionDb;

export async function iniciar(
donacionId: number,
operador: string,
db: CalificacionDb = dbPredeterminada,
) {
const donacion = await db.donacion.findUnique({
where: { id: donacionId },
});

if (!donacion) {
throw new DonacionNoEncontradaError();
}

if (donacion.estado === "RECHAZADA") {
throw new DonacionBloqueadaError();
}

const existente = await db.calificacionBiologica.findUnique({
where: { donacionId },
});

if (existente) {
return { calificacion: existente, creada: false };
}

try {
const calificacion = await db.calificacionBiologica.create({
data: {
donacionId,
operador,
estado: "INICIADA",
},
});

return { calificacion, creada: true };

} catch (error) {
// Si otra solicitud creó el registro simultáneamente,
// recuperamos la calificación que ya existe.
if (
error instanceof Prisma.PrismaClientKnownRequestError &&
error.code === "P2002"
) {
const calificacion = await db.calificacionBiologica.findUnique({
where: { donacionId },
});

  if (calificacion) {
    return { calificacion, creada: false };
  }
}

throw error;

}
}