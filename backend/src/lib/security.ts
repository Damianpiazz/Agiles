import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import { badRequest } from "../lib/errors";

const KEY_LENGTH = 64;

/**
 * Hashea una contraseña con scrypt. Formato: `scrypt$<salt>$<hash>`.
 */
export function hashPassword(password: string): string {
  if (password.length < 6) {
    throw badRequest("La contraseña debe tener al menos 6 caracteres");
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, hash] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(expected, actual);
}

export interface TokenPayload {
  sub: number;
  usuario: string;
  rol: string;
  exp: number;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(payload: string): string {
  return base64UrlEncode(createHmac("sha256", env.authSecret).update(payload).digest());
}

/** Crea un token stateless firmado con HMAC-SHA256. */
export function createToken(payload: Omit<TokenPayload, "exp">, ttlHours = env.authTokenTtlHours): string {
  const body: TokenPayload = {
    ...payload,
    exp: Date.now() + ttlHours * 60 * 60 * 1000,
  };
  const encoded = base64UrlEncode(JSON.stringify(body));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as TokenPayload;
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
