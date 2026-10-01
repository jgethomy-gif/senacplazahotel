
const express = require("express");
const db = require("../database");

const router = express.Router();

// ===============================
// GET - Listar todos os quartos
// ===============================
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


// ===============================
// POST - Criar novo quarto
// ===============================
router.post("/", async (req, res) => {
  try {
    const {
      numero,
      tipo,
      preco_diaria,
      disponivel
    } = req.body;

    if (!numero || !tipo || preco_diaria === undefined) {
      return res.status(400).json({
        mensagem: "Número, tipo e preço da diária são obrigatórios."
      });
    }

    const disponibilidade =
      disponivel === undefined ? 1 : Number(disponivel);

    if (![0, 1].includes(disponibilidade)) {
      return res.status(400).json({
        mensagem: "O campo disponivel deve ser 0 ou 1."
      });
    }

    const [existente] = await db.query(
      "SELECT id FROM quartos WHERE numero = ?",
      [numero]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        mensagem: "Já existe um quarto com esse número."
      });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO quartos
        (numero, tipo, preco_diaria, disponivel)
      VALUES (?, ?, ?, ?)
      `,
      [numero, tipo, preco_diaria, disponibilidade]
    );

    res.status(201).json({
      mensagem: "Quarto criado com sucesso.",
      id: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar quarto:", error);

    res.status(500).json({
      mensagem: "Erro ao criar quarto."
    });
  }
});


// ===============================
// PUT - Atualizar quarto
// ===============================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      numero,
      tipo,
      preco_diaria,
      disponivel
    } = req.body;

    if (!numero || !tipo || preco_diaria === undefined) {
      return res.status(400).json({
        mensagem: "Número, tipo e preço da diária são obrigatórios."
      });
    }

    const disponibilidade =
      disponivel === undefined ? 1 : Number(disponivel);

    if (![0, 1].includes(disponibilidade)) {
      return res.status(400).json({
        mensagem: "O campo disponivel deve ser 0 ou 1."
      });
    }

    const [quarto] = await db.query(
      "SELECT id FROM quartos WHERE id = ?",
      [id]
    );

    if (quarto.length === 0) {
      return res.status(404).json({
        mensagem: "Quarto não encontrado."
      });
    }

    const [numeroExistente] = await db.query(
      "SELECT id FROM quartos WHERE numero = ? AND id <> ?",
      [numero, id]
    );

    if (numeroExistente.length > 0) {
      return res.status(409).json({
        mensagem: "Já existe outro quarto com esse número."
      });
    }

    await db.query(
      `
      UPDATE quartos
      SET
        numero = ?,
        tipo = ?,
        preco_diaria = ?,
        disponivel = ?
      WHERE id = ?
      `,
      [numero, tipo, preco_diaria, disponibilidade, id]
    );

    res.json({
      mensagem: "Quarto atualizado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar quarto:", error);

    res.status(500).json({
      mensagem: "Erro ao atualizar quarto."
    });
  }
});


// ===============================
// DELETE - Excluir quarto
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [quarto] = await db.query(
      "SELECT id FROM quartos WHERE id = ?",
      [id]
    );

    if (quarto.length === 0) {
      return res.status(404).json({
        mensagem: "Quarto não encontrado."
      });
    }

    await db.query(
      "DELETE FROM quartos WHERE id = ?",
      [id]
    );

    res.json({
      mensagem: "Quarto excluído com sucesso."
    });

  } catch (error) {
    console.error("Erro ao excluir quarto:", error);

    res.status(500).json({
      mensagem: "Erro ao excluir quarto."
    });
  }
});


module.exports = router;