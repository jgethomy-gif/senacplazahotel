const express = require("express");
const db = require("../database");

const router = express.Router();

// GET - lista todos os quartos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        numero,
        tipo,
        preco_diaria,
        disponivel
      FROM quartos
      ORDER BY numero
    `);

    res.json(rows);

  } catch (error) {
    console.error("Erro ao buscar quartos:", error);

    res.status(500).json({
      mensagem: "Erro ao buscar quartos."
    });
  }
});

module.exports = router;