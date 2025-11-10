import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

// 📡 Conexión a PostgreSQL
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.USE_SSL === "true",
});

// 🧠 Endpoint de estado base
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "🚀 API Fulltech AI corriendo correctamente" });
});

// 📘 Crear tabla si no existe
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      conversation_id VARCHAR(50),
      role VARCHAR(10),
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ Tabla 'conversations' lista");
}
ensureTables();

// 🧩 Guardar mensaje (memoria persistente)
app.post("/memory/save", async (req, res) => {
  const { conversation_id, role, content } = req.body;
  if (!conversation_id || !role || !content) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    await pool.query(
      `INSERT INTO conversations (conversation_id, role, content)
       VALUES ($1, $2, $3)`,
      [conversation_id, role, content]
    );
    res.json({ ok: true, msg: "💾 Mensaje guardado correctamente" });
  } catch (err) {
    console.error("❌ Error al guardar mensaje:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📖 Cargar historial de mensajes
app.get("/memory/load/:conversation_id", async (req, res) => {
  const { conversation_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT role, content, created_at
       FROM conversations
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversation_id]
    );

    res.json({ ok: true, messages: result.rows });
  } catch (err) {
    console.error("❌ Error al cargar mensajes:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🧹 Limpiar memoria (opcional)
app.delete("/memory/clear/:conversation_id", async (req, res) => {
  const { conversation_id } = req.params;
  try {
    await pool.query(`DELETE FROM conversations WHERE conversation_id = $1`, [
      conversation_id,
    ]);
    res.json({ ok: true, msg: "🧹 Memoria eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error al limpiar memoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
