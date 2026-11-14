import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../generated/prisma/client";
import type { CrearPacienteInput } from "../types/paciente.types";
import { buscar, create, PacienteDuplicadoError } from "./paciente.service";
import { prisma } from "../config/prisma";

vi.mock("../config/prisma", () => ({
  prisma: {
    paciente: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mockCreate = vi.mocked(prisma.paciente.create);
const mockFindMany = vi.mocked(prisma.paciente.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("paciente.service", () => {
  it("registra los datos validados con el usuario operador", async () => {
    const datos: CrearPacienteInput = {
      nombre: "Lucía",
      apellido: "Fernández",
      dni: "30111222",
      fechaNacimiento: new Date("1990-04-15"),
      operador: "Ana",
    };
    const paciente = { id: 1, ...datos, createdAt: new Date() };
    mockCreate.mockResolvedValue(paciente as never);

    await expect(create(datos)).resolves.toBe(paciente);
    expect(mockCreate).toHaveBeenCalledWith({ data: datos });
  });

  it("convierte la restricción única de DNI en un error de duplicado", async () => {
    mockCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("DNI duplicado", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      create({
        nombre: "Lucía",
        apellido: "Fernández",
        dni: "30111222",
        fechaNacimiento: new Date("1990-04-15"),
        operador: "Ana",
      }),
    ).rejects.toBeInstanceOf(PacienteDuplicadoError);
  });

  it("lista pacientes ordenados para permitir su selección posterior", async () => {
    mockFindMany.mockResolvedValue([]);

    await buscar({ nombre: "luc" });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        nombre: { contains: "luc", mode: "insensitive" },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });
  });
});
