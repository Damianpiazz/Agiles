import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../generated/prisma/client";
import type { ActualizarDonanteInput } from "../types/donante.types";
import { actualizar, DonanteNoEncontradoError } from "./donante.service";
import { prisma } from "../config/prisma";

vi.mock("../config/prisma", () => ({
  prisma: {
    donante: {
      update: vi.fn(),
    },
  },
}));

const mockUpdate = vi.mocked(prisma.donante.update);

beforeEach(() => {
  vi.clearAllMocks();
});

const datosActualizacion: ActualizarDonanteInput = {
  domicilio: "Bv. Oroño 550",
  codigoPostal: "2000",
  email: "maria.elena@example.com",
  telefonoFijo: "",
  telefonoCelular: "3415559999",
  operador: "Ana Operadora",
};

describe("donante.service actualizar", () => {
  it("actualiza los campos de domicilio y contacto y mapea operador a operadorModificacion y telefonoFijo vacío a null", async () => {
    const donanteActualizado = {
      id: 1,
      ...datosActualizacion,
      telefonoFijo: null,
      operadorModificacion: "Ana Operadora",
      updatedAt: new Date(),
      donaciones: [],
    };
    mockUpdate.mockResolvedValue(donanteActualizado as never);

    const resultado = await actualizar(1, datosActualizacion);

    expect(resultado).toBe(donanteActualizado);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: {
          domicilio: "Bv. Oroño 550",
          codigoPostal: "2000",
          email: "maria.elena@example.com",
          telefonoFijo: null,
          telefonoCelular: "3415559999",
          operadorModificacion: "Ana Operadora",
        },
        include: expect.objectContaining({
          donaciones: expect.any(Object),
        }),
      }),
    );
  });

  it("lanza DonanteNoEncontradoError cuando Prisma arroja P2025", async () => {
    mockUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Registro no encontrado", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(actualizar(999, datosActualizacion)).rejects.toBeInstanceOf(
      DonanteNoEncontradoError,
    );
  });
});
