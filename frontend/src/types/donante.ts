export type Donante = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  sexoBiologico: "MASCULINO" | "FEMENINO";
  domicilio: string;
  codigoPostal: string;
  email: string;
  telefonoFijo: string | null;
  telefonoCelular: string;
};
