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


// PUT - atualiza usuário + endereço
router.put("/:id", async (req, res) => {

  const { id } = req.params;

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

  if (
    !nome ||
    !data_nascimento ||
    !email ||
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

    if (senha) {

      await connection.query(
        `
        UPDATE usuarios
        SET nome = ?,
            data_nascimento = ?,
            email = ?,
            senha = ?
        WHERE id = ?
        `,
        [
          nome,
          data_nascimento,
          email,
          senha,
          id
        ]
      );

    } else {

      await connection.query(
        `
        UPDATE usuarios
        SET nome = ?,
            data_nascimento = ?,
            email = ?
        WHERE id = ?
        `,
        [
          nome,
          data_nascimento,
          email,
          id
        ]
      );

    }

    await connection.query(
      `
      UPDATE info_usuario
      SET cep = ?,
          logradouro = ?,
          numero = ?,
          complemento = ?,
          unidade = ?,
          bairro = ?,
          localidade = ?,
          uf = ?,
          estado = ?,
          regiao = ?,
          ibge = ?,
          gia = ?,
          ddd = ?,
          siafi = ?
      WHERE id_usuario = ?
      `,
      [
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
        siafi || null,
        id
      ]
    );

    await connection.commit();

    res.json({
      mensagem: "Cliente atualizado com sucesso!"
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error("Erro ao atualizar:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este e-mail já está cadastrado."
      });
    }

    res.status(500).json({
      mensagem: "Erro ao atualizar cliente."
    });

  } finally {

    if (connection) {
      connection.release();
    }

  }
});


// DELETE - exclui usuário + endereço
router.delete("/:id", async (req, res) => {

  const { id } = req.params;

  let connection;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();

    await connection.query(
      `
      DELETE FROM info_usuario
      WHERE id_usuario = ?
      `,
      [id]
    );

    const [result] = await connection.query(
      `
      DELETE FROM usuarios
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {

      await connection.rollback();

      return res.status(404).json({
        mensagem: "Cliente não encontrado."
      });

    }

    await connection.commit();

    res.json({
      mensagem: "Cliente excluído com sucesso!"
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error("Erro ao excluir:", error);

    res.status(500).json({
      mensagem: "Erro ao excluir cliente."
    });

  } finally {

    if (connection) {
      connection.release();
    }

  }
});


module.exports = router;