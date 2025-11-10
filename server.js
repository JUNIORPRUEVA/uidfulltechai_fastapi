import express from "express";
import pkg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// 🧠 Configuración interna del PostgreSQL
const pool = new Pool({
  host: process.env.PGHOST || "postgresql_postgres-n8n",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || "uid_dbjunioridigital",
  user: process.env.PGUSER || "n8n_user",
  password: process.env.PGPASSWORD || "Ayleen10.yahaira",
  ssl: process.env.USE_SSL === "true" ? { rejectUnauthorized: false } : false
});

// 🚦 Endpoint raíz
app.get("/", (req, res) => {
  res.send("🚀 API FulltechAI corriendo dentro de EasyPanel con PostgreSQL interno");
});

// 💾 Endpoint para probar conexión a PostgreSQL
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "✅ Conectado correctamente a PostgreSQL", now: result.rows[0] });
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor API corriendo en puerto ${PORT}`));
