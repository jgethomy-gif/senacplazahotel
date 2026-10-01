const express = require("express");
const db = require("../database");

const router = express.Router();

// GET - lista os cadastros
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        usuarios.id,
        usuarios.nome,
        usuarios.data_nascimento,
        usuarios.email,
        info_usuario.cep,
        info_usuario.logradouro,
        info_usuario.numero,
        info_usuario.complemento,
        info_usuario.unidade,
        info_usuario.bairro,
        info_usuario.localidade,
        info_usuario.uf,
        info_usuario.estado,
        info_usuario.regiao,
        info_usuario.ibge,
        info_usuario.gia,
        info_usuario.ddd,
        info_usuario.siafi
      FROM usuarios
      INNER JOIN info_usuario
        ON usuarios.id = info_usuario.id_usuario
      ORDER BY usuarios.id DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Erro ao buscar cadastros:", error);

    res.status(500).json({
      mensagem: "Erro ao buscar cadastros."
    });
  }
});

// POST - cadastra usuário + endereço
router.post("/", async (req, res) => {

  const {
    nome,
    data_nascimento,
    email,
    senha,
    cep,
    rua,
    numero,
    complemento,
    unidade,
    bairro,
    cidade,
    uf,
    estado,
    regiao,
    ibge,
    gia,
    ddd,
    siafi
  } = req.body;

  // Campos obrigatórios
  if (
    !nome ||
    !data_nascimento ||
    !email ||
    !senha ||
    !cep ||
    !rua ||
    !numero ||
    !bairro ||
    !cidade ||
    !uf ||
    !estado ||
    !regiao
  ) {
    return res.status(400).json({
      mensagem: "Preencha todos os campos obrigatórios."
    });
  }

  let connection;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();

    // 1. Cadastra usuário
    const [usuarioResult] = await connection.query(
      `
      INSERT INTO usuarios
      (nome, data_nascimento, email, senha)
      VALUES (?, ?, ?, ?)
      `,
      [
        nome,
        data_nascimento,
        email,
        senha
      ]
    );

    const idUsuario = usuarioResult.insertId;

    // 2. Cadastra endereço
    await connection.query(
      `
      INSERT INTO info_usuario
      (
        id_usuario,
        cep,
        logradouro,
        numero,
        complemento,
        unidade,
        bairro,
        localidade,
        uf,
        estado,
        regiao,
        ibge,
        gia,
        ddd,
        siafi
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        idUsuario,
        cep,
        rua,
        numero,
        complemento || null,
        unidade || null,
        bairro,
        cidade,
        uf,
        estado,
        regiao,
        ibge || null,
        gia || null,
        ddd || null,
        siafi || null
      ]
    );

    await connection.commit();

    res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      id_usuario: idUsuario
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error("Erro ao cadastrar:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    res.status(500).json({
      mensagem: "Erro ao realizar cadastro."
    });

  } finally {

    if (connection) {
      connection.release();
    }

  }
});

module.exports = router;