import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de conexión PostgreSQL
const pool = new pg.Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: false
});

// 🌐 Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 API Fulltech PostgreSQL corriendo correctamente!");
});

// 💬 Guardar un mensaje
app.post("/message", async (req, res) => {
  const { conversation_id, role, content } = req.body;
  try {
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
      [conversation_id, role, content]
    );
    res.json({ success: true, message: "💾 Mensaje guardado correctamente" });
  } catch (err) {
    console.error("Error al guardar mensaje:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📜 Obtener mensajes
app.get("/messages/:conversation_id", async (req, res) => {
  const { conversation_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [conversation_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener mensajes:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧠 Crear conversación
app.post("/conversation", async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO conversations (title) VALUES ($1) RETURNING id",
      [title || "Nueva conversación"]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Error al crear conversación:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor API corriendo en puerto ${PORT}`));
