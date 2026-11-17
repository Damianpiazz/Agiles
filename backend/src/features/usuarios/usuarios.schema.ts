import { z } from "zod";
import { EstadoUsuario, RolUsuario } from "../../../generated/prisma/enums";

const roles = Object.values(RolUsuario) as [RolUsuario, ...RolUsuario[]];
const estados = Object.values(EstadoUsuario) as [EstadoUsuario, ...EstadoUsuario[]];

export const createUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  usuario: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, "El usuario solo admite letras, números, puntos, guiones y guiones bajos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100),
  rol: z.enum(roles).default("TECNICO_HEMOTERAPIA"),
  estado: z.enum(estados).default("ACTIVO"),
});

export const updateUsuarioSchema = createUsuarioSchema.partial();

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
