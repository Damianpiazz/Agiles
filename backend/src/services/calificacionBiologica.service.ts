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

export async function iniciar(donacionId: number, operador: string) {
const donacion = await prisma.donacion.findUnique({
where: { id: donacionId },
});

if (!donacion) {
throw new DonacionNoEncontradaError();
}

const existente = await prisma.calificacionBiologica.findUnique({
where: { donacionId },
});

if (existente) {
return { calificacion: existente, creada: false };
}

try {
const calificacion = await prisma.calificacionBiologica.create({
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
const calificacion = await prisma.calificacionBiologica.findUnique({
where: { donacionId },
});

  if (calificacion) {
    return { calificacion, creada: false };
  }
}

throw error;

}
}