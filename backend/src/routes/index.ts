import { Router } from "express";
import { sendData } from "../lib/http";
import authRoutes from "../features/auth/auth.routes";
import personasRoutes from "../features/personas/personas.routes";
import donacionesRoutes from "../features/donaciones/donaciones.routes";
import transfusionesRoutes from "../features/transfusiones/transfusiones.routes";
import sangriasRoutes from "../features/sangrias/sangrias.routes";
import serologiasRoutes, { serologiaResultadosRouter } from "../features/serologias/serologias.routes";
import pciRoutes, { pciResultadosRouter } from "../features/pci/pci.routes";
import pcdRoutes, { pcdResultadosRouter } from "../features/pcd/pcd.routes";
import gestantesRoutes, { gestantesPciRouter } from "../features/gestantes/gestantes.routes";
import recienNacidosRoutes from "../features/recien-nacidos/recien-nacidos.routes";
import usuariosRoutes from "../features/usuarios/usuarios.routes";
import auditoriaRoutes from "../features/auditoria/auditoria.routes";
import reportesRoutes from "../features/reportes/reportes.routes";
import {
  ciudadesRouter,
  domiciliosRouter,
  provinciasRouter,
} from "../features/ubicaciones/ubicaciones.routes";
import { catalogosCrudRouter, catalogosRouter } from "../features/catalogos/catalogos.routes";

const apiRouter = Router();

/** Índice de recursos disponibles, útil para descubrir la API. */
apiRouter.get("/", (_req, res) => {
  sendData(res, {
    version: "v1",
    recursos: [
      "auth",
      "personas",
      "donaciones",
      "transfusiones",
      "sangrias-terapeuticas",
      "serologias",
      "pci",
      "pcd",
      "gestantes",
      "recien-nacidos",
      "provincias",
      "ciudades",
      "domicilios",
      "catalogos",
      "usuarios",
      "auditoria",
      "reportes",
    ],
  });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/personas", personasRoutes);
apiRouter.use("/donaciones", donacionesRoutes);
apiRouter.use("/transfusiones", transfusionesRoutes);
apiRouter.use("/sangrias-terapeuticas", sangriasRoutes);

apiRouter.use("/serologias", serologiasRoutes);
apiRouter.use("/serologia-resultados", serologiaResultadosRouter);

apiRouter.use("/pci", pciRoutes);
apiRouter.use("/pci-resultados", pciResultadosRouter);

apiRouter.use("/pcd", pcdRoutes);
apiRouter.use("/pcd-resultados", pcdResultadosRouter);

apiRouter.use("/gestantes", gestantesRoutes);
apiRouter.use("/gestantes-pci", gestantesPciRouter);
apiRouter.use("/recien-nacidos", recienNacidosRoutes);

apiRouter.use("/provincias", provinciasRouter);
apiRouter.use("/ciudades", ciudadesRouter);
apiRouter.use("/domicilios", domiciliosRouter);

apiRouter.use("/catalogos", catalogosRouter);
apiRouter.use("/catalogos", catalogosCrudRouter);

apiRouter.use("/usuarios", usuariosRoutes);
apiRouter.use("/auditoria", auditoriaRoutes);
apiRouter.use("/reportes", reportesRoutes);

export default apiRouter;
