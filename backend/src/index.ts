import express from "express";
import cors from "cors";
import donanteRoutes from "./routes/donante.routes";
import donacionRoutes from "./routes/donacion.routes";
import pciRoutes from "./routes/pci.routes";
import serologiaRoutes from "./routes/serologia.routes";
import catalogoRoutes from "./routes/catalogo.routes";
import calificacionBiologicaRoutes from "./routes/calificacionBiologica.routes";
import anticuerpoIrregularRoutes from "./routes/anticuerpoIrregular.routes";
import tipificacionSanguineaRoutes from "./routes/tipificacionSanguinea.routes";
import tamizajeInfeccionesRoutes from "./routes/tamizajeInfecciones.routes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, app: "Florhema API" });
});

app.use("/api/donantes", donanteRoutes);
app.use("/api/donaciones", donacionRoutes);
app.use("/api/pci", pciRoutes);
app.use("/api/serologias", serologiaRoutes);
app.use("/api/catalogos", catalogoRoutes);
app.use("/api/calificaciones-biologicas", calificacionBiologicaRoutes);
app.use("/api/anticuerpos-irregulares", anticuerpoIrregularRoutes);
app.use("/api/tipificaciones-sanguineas", tipificacionSanguineaRoutes);
app.use("/api/tamizajes-infecciones", tamizajeInfeccionesRoutes);

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));