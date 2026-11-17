import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROL_LABELS, type Rol } from "@/shared/constants/roles";
import { usuariosApi } from "@/features/usuarios/api/usuarios.api";
import type { Usuario, UsuarioInput } from "@/features/usuarios/types";
import { Button } from "@/shared/components/ui/Button";
import { DataTable, type Columna } from "@/shared/components/ui/DataTable";
import { Field } from "@/shared/components/ui/Field";
import { FormActions } from "@/shared/components/ui/FormActions";
import { Notice } from "@/shared/components/ui/Notice";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Section } from "@/shared/components/ui/Section";
import { StatusChip } from "@/shared/components/ui/StatusChip";
import { mensajeDeError } from "@/infrastructure/api/errors";

interface Formulario {
  id: number | null;
  nombreCompleto: string;
  usuario: string;
  password: string;
  rol: Rol;
  estado: "ACTIVO" | "INACTIVO";
}

const VACIO: Formulario = {
  id: null,
  nombreCompleto: "",
  usuario: "",
  password: "",
  rol: "TECNICO_HEMOTERAPIA",
  estado: "ACTIVO",
};

const ROLES: Rol[] = ["ADMINISTRADOR", "TECNICO_HEMOTERAPIA", "CONSULTA_MATERNIDAD"];

function separarNombre(valor: string): { nombre: string; apellido: string } {
  const partes = valor.trim().split(/\s+/).filter(Boolean);
  if (partes.length < 2) return { nombre: partes[0] ?? "", apellido: "" };
  return { nombre: partes.slice(0, -1).join(" "), apellido: partes[partes.length - 1] };
}

export function UsuariosPage() {
  const [formulario, setFormulario] = useState<Formulario>(VACIO);
  const queryClient = useQueryClient();

  const usuarios = useQuery({ queryKey: ["usuarios"], queryFn: () => usuariosApi.listar({ limit: 100 }) });

  function cambiar(clave: keyof Formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [clave]: valor }));
  }

  function editar(item: Usuario) {
    setFormulario({
      id: item.id,
      nombreCompleto: `${item.nombre} ${item.apellido}`.trim(),
      usuario: item.usuario,
      password: "",
      rol: ROLES.includes(item.rol as Rol) ? (item.rol as Rol) : "TECNICO_HEMOTERAPIA",
      estado: item.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    });
  }

  const guardar = useMutation({
    mutationFn: () => {
      const { nombre, apellido } = separarNombre(formulario.nombreCompleto);
      const datos: UsuarioInput = {
        nombre,
        apellido,
        usuario: formulario.usuario,
        rol: formulario.rol,
        estado: formulario.estado,
        ...(formulario.password ? { password: formulario.password } : {}),
      };
      return formulario.id ? usuariosApi.actualizar(formulario.id, datos) : usuariosApi.crear(datos);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setFormulario(VACIO);
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!guardar.isPending) guardar.mutate();
  }

  const columnas: Columna<Usuario>[] = [
    { clave: "nombre", titulo: "Nombre", celda: (item) => `${item.nombre} ${item.apellido}` },
    { clave: "usuario", titulo: "Usuario", celda: (item) => <span className="mono">{item.usuario}</span> },
    { clave: "rol", titulo: "Rol", celda: (item) => ROL_LABELS[item.rol as Rol] ?? item.rol },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (item) => (
        <StatusChip tono={item.estado === "ACTIVO" ? "ok" : "neutral"}>
          {item.estado === "ACTIVO" ? "Activo" : "Inactivo"}
        </StatusChip>
      ),
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      celda: (item) => (
        <Button type="button" size="sm" variant="ghost" onClick={() => editar(item)}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios y técnicos"
        subtitle="Gestión de cuentas (técnicos Hemoterapia y acceso consulta Gestantes/Maternidad). Sin usuarios donantes."
        actions={
          <Button type="button" variant="primary" onClick={() => setFormulario(VACIO)}>
            Nuevo usuario
          </Button>
        }
      />

      <Section title="Alta / edición">
        {guardar.isError ? (
          <Notice tono="danger" titulo="No se pudo guardar el usuario">
            {mensajeDeError(guardar.error)}
          </Notice>
        ) : null}
        <form onSubmit={enviar}>
          <div className="form-grid">
            <Field label="Nombre y apellido" htmlFor="usuario-nombre" required ancho={6} hint="Ingrese nombre y apellido separados por un espacio.">
              <input id="usuario-nombre" className="input" value={formulario.nombreCompleto} onChange={(evento) => cambiar("nombreCompleto", evento.target.value)} required />
            </Field>
            <Field label="Usuario" htmlFor="usuario-usuario" required ancho={3}>
              <input id="usuario-usuario" className="input" value={formulario.usuario} onChange={(evento) => cambiar("usuario", evento.target.value)} required />
            </Field>
            <Field label="Contraseña" htmlFor="usuario-password" required={!formulario.id} ancho={3} hint={formulario.id ? "Dejá vacío para mantener la actual" : undefined}>
              <input id="usuario-password" className="input" type="password" value={formulario.password} onChange={(evento) => cambiar("password", evento.target.value)} required={!formulario.id} />
            </Field>
            <Field label="Rol" htmlFor="usuario-rol" ancho={4}>
              <select id="usuario-rol" className="select" value={formulario.rol} onChange={(evento) => cambiar("rol", evento.target.value)}>
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>{ROL_LABELS[rol]}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado" htmlFor="usuario-estado" ancho={4}>
              <select id="usuario-estado" className="select" value={formulario.estado} onChange={(evento) => cambiar("estado", evento.target.value)}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </Field>
            <div className="field field--12">
              <FormActions submitLabel="Guardar" loading={guardar.isPending} onCancel={() => setFormulario(VACIO)} />
            </div>
          </div>
        </form>
      </Section>

      <Section title="Cuentas" description="Personal autorizado del servicio">
        <DataTable
          columnas={columnas}
          filas={usuarios.data?.data ?? []}
          claveFila={(item) => item.id}
          cargando={usuarios.isLoading}
          error={usuarios.isError ? "No se pudo consultar el listado de usuarios." : undefined}
          onReintentar={() => void usuarios.refetch()}
        />
      </Section>
    </>
  );
}
