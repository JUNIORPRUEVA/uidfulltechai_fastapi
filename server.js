import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ Variables de entorno
const PORT = process.env.PORT || 3000;

// 💾 Conexión con PostgreSQL (usando variables de entorno)
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

// ✅ Crear tablas si no existen
async function ensureTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS fulltechuiconversation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT DEFAULT 'Conversación Fulltech',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fulltechuimensage (
        id BIGSERIAL PRIMARY KEY,
        conversation_id UUID REFERENCES fulltechuiconversation(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✅ Tablas verificadas correctamente.");
  } catch (err) {
    console.error("❌ Error al crear/verificar tablas:", err);
  } finally {
    client.release();
  }
}

// 🧩 Endpoint: crear conversación
app.post("/api/conversations", async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO fulltechuiconversation (title) VALUES ($1) RETURNING *",
      [title || "Nueva conversación"]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("⚠️ Error al crear conversación:", error);
    res.status(500).json({ error: "Error al crear conversación" });
  }
});

// 🧩 Endpoint: guardar mensaje
app.post("/api/messages", async (req, res) => {
  const { conversation_id, role, content } = req.body;
  try {
    await pool.query(
      "INSERT INTO fulltechuimensage (conversation_id, role, content) VALUES ($1, $2, $3)",
      [conversation_id, role, content]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("⚠️ Error al guardar mensaje:", error);
    res.status(500).json({ error: "Error al guardar mensaje" });
  }
});

// 🧩 Endpoint: obtener mensajes por conversación
app.get("/api/messages/:conversation_id", async (req, res) => {
  const { conversation_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM fulltechuimensage WHERE conversation_id = $1 ORDER BY created_at ASC",
      [conversation_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("⚠️ Error al obtener mensajes:", error);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

// 🟢 Ruta de prueba
app.get("/ping", (req, res) => {
  res.json({ status: "✅ Servidor activo y corriendo perfectamente" });
});

// 🚀 Iniciar servidor
app.listen(PORT, async () => {
  await ensureTables();
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  setInterval(() => console.log("⏳ Manteniendo servidor activo..."), 60000);
});
