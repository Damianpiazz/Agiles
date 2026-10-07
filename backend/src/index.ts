import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, app: "Florhema API" });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));