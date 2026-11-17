export interface ItemCatalogo {
  id: number;
  nombre?: string | null;
  grupo?: string | null;
  factor?: string | null;
  codigoPostal?: string | null;
  provincia?: { id: number; nombre: string } | null;
  ciudades?: Array<{ id: number; nombre: string }>;
}

export interface CatalogoConsolidado {
  provincias: ItemCatalogo[];
  ciudades: ItemCatalogo[];
  gruposFactor: ItemCatalogo[];
  obrasSociales: ItemCatalogo[];
  medicos: ItemCatalogo[];
  determinacionesSerologicas: ItemCatalogo[];
  determinacionesPcd: ItemCatalogo[];
  antigenos: ItemCatalogo[];
  fenotipos: ItemCatalogo[];
  tiposTransfusion: ItemCatalogo[];
}
