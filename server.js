const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1", // عدّلها لـ IP سيرفر الداتا بيز
  user: process.env.DB_USER || "app_user",
  password: process.env.DB_PASSWORD || "app_password",
  database: process.env.DB_NAME || "murhaf_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0].ok });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "error" });
  }
});

app.get("/api/notes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/notes error:", err);
    res.status(500).json({ message: "Error fetching notes" });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO notes (title, content) VALUES (?, ?)",
      [title, content]
    );

    const [rows] = await pool.query(
      "SELECT id, title, content, created_at FROM notes WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /api/notes error:", err);
    res.status(500).json({ message: "Error creating note" });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    const [result] = await pool.query("DELETE FROM notes WHERE id = ?", [noteId]);

  if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("DELETE /api/notes/:id error:", err);
    res.status(500).json({ message: "Error deleting note" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});