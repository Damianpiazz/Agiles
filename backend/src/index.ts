import express from "express";
import cors from "cors";
import donanteRoutes from "./routes/donante.routes";
import donacionRoutes from "./routes/donacion.routes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, app: "Florhema API" });
});

app.use("/api/donantes", donanteRoutes);
app.use("/api/donaciones", donacionRoutes);

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));