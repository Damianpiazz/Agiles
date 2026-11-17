import { describe, expect, it } from "vitest";
import { AppError } from "./errors";
import { parseId } from "./crud";
import { toCsv } from "./csv";
import { createToken, hashPassword, verifyPassword, verifyToken } from "./security";

describe("parseId", () => {
  it("convierte identificadores válidos", () => {
    expect(parseId("42")).toBe(42);
    expect(parseId(["7", "8"])).toBe(7);
  });

  it("rechaza identificadores inválidos", () => {
    expect(() => parseId("0")).toThrow(AppError);
    expect(() => parseId("abc")).toThrow(AppError);
    expect(() => parseId(undefined)).toThrow(AppError);
  });
});

describe("toCsv", () => {
  it("usa punto y coma como separador y escapa campos especiales", () => {
    const csv = toCsv([
      { nombre: "Pérez, Juan", dni: "12345678" },
      { nombre: 'Ana "La Jefa"', dni: "1;2" },
    ]);
    expect(csv).toContain("nombre;dni");
    expect(csv).toContain("Pérez, Juan;12345678");
    expect(csv).toContain('"Ana ""La Jefa""";"1;2"');
  });

  it("devuelve vacío si no hay filas", () => {
    expect(toCsv([])).toBe("");
  });
});

describe("seguridad", () => {
  it("hashea contraseñas con salt y las verifica", () => {
    const hash = hashPassword("Secreta.123");
    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(verifyPassword("Secreta.123", hash)).toBe(true);
    expect(verifyPassword("otra-clave", hash)).toBe(false);
  });

  it("rechaza contraseñas demasiado cortas", () => {
    expect(() => hashPassword("123")).toThrow(AppError);
  });

  it("firma y valida tokens", () => {
    const token = createToken({ sub: 7, usuario: "fperez", rol: "TECNICO_HEMOTERAPIA" });
    const payload = verifyToken(token);
    expect(payload?.sub).toBe(7);
    expect(payload?.usuario).toBe("fperez");
    expect(verifyToken(`${token}x`)).toBeNull();
    expect(verifyToken("sin-firma")).toBeNull();
  });
});
