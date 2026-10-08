require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { OAuth2Client } = require("google-auth-library");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3001;

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

/* =========================================================
   CONEXÃO COM BANCO DE DADOS
========================================================= */

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "SenacPlazaHotel",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* =========================================================
   TESTE DA API
========================================================= */

app.get("/", function (req, res) {
  res.json({
    mensagem: "API Hotel funcionando!",
    porta: PORT
  });
});

/* =========================================================
   TESTE DO BANCO
========================================================= */

app.get("/teste-db", async function (req, res) {
  try {
    const [resultado] = await pool.query(
      "SELECT 1 AS teste"
    );

    res.json({
      mensagem: "Banco conectado com sucesso!",
      resultado
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao conectar com o banco.",
      erro: error.message
    });
  }
});

/* =========================================================
   CEP
========================================================= */

app.get("/cep/:cep", async function (req, res) {
  try {
    const { cep } = req.params;

    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        mensagem: "CEP invalido."
      });
    }

    const resposta = await fetch(
      `https://viacep.com.br/ws/${cepLimpo}/json/`
    );

    const dados = await resposta.json();

    if (dados.erro) {
      return res.status(404).json({
        mensagem: "CEP nao encontrado."
      });
    }

    res.json(dados);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao consultar CEP.",
      erro: error.message
    });
  }
});

/* =========================================================
   LOGIN NORMAL
========================================================= */

app.post("/login", async function (req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        mensagem: "Informe o e-mail e a senha."
      });
    }

    const [usuarios] = await pool.query(
      `
      SELECT
        id,
        nome,
        data_nascimento,
        email,
        senha
      FROM usuarios
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos."
      });
    }

    const usuario = usuarios[0];

    if (usuario.senha !== senha) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos."
      });
    }

    res.json({
      mensagem: "Login realizado com sucesso!",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        data_nascimento: usuario.data_nascimento,
        email: usuario.email
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao realizar login.",
      erro: error.message
    });
  }
});

/* =========================================================
   LOGIN COM GOOGLE
========================================================= */

app.post("/auth/google", async function (req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        mensagem: "Token do Google nao informado."
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        mensagem:
          "GOOGLE_CLIENT_ID nao configurado no servidor."
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        mensagem:
          "Nao foi possivel validar a conta Google."
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const nome = payload.name || "";
    const emailVerificado = payload.email_verified;

    if (!email || !emailVerificado) {
      return res.status(401).json({
        mensagem:
          "O e-mail da conta Google nao foi verificado."
      });
    }

    const [usuarios] = await pool.query(
      `
      SELECT
        id,
        nome,
        data_nascimento,
        email
      FROM usuarios
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensagem:
          "Esta conta Google ainda nao possui cadastro. Faça o cadastro primeiro.",
        google: {
          nome,
          email,
          googleId
        }
      });
    }

    const usuario = usuarios[0];

    res.json({
      mensagem:
        "Login com Google realizado com sucesso!",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        data_nascimento: usuario.data_nascimento,
        email: usuario.email,
        googleId
      }
    });

  } catch (error) {
    console.error("Erro Google:", error);

    res.status(401).json({
      mensagem:
        "Nao foi possivel autenticar com o Google."
    });
  }
});

/* =========================================================
   CLIENTES - LISTAR
========================================================= */

app.get("/cadastros", async function (req, res) {
  try {
    const [cadastros] = await pool.query(`
      SELECT
        u.id AS id_usuario,
        u.nome,
        u.data_nascimento,
        u.email,
        u.senha,

        i.cep,
        i.logradouro AS rua,
        i.numero,
        i.complemento,
        i.unidade,
        i.bairro,
        i.localidade AS cidade,
        i.uf,
        i.estado,
        i.regiao,
        i.ibge,
        i.gia,
        i.ddd,
        i.siafi

      FROM usuarios u

      LEFT JOIN info_usuario i
        ON u.id = i.id_usuario

      ORDER BY u.id DESC
    `);

    res.json(cadastros);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar cadastros.",
      erro: error.message
    });
  }
});

/* =========================================================
   CLIENTES - CADASTRAR
========================================================= */

app.post("/cadastros", async function (req, res) {
  let conexao;

  try {
    const {
      nome,
      data_nascimento,
      email,
      senha,
      cpf,
      telefone,
      cep,
      rua,
      logradouro,
      numero,
      complemento,
      unidade,
      bairro,
      cidade,
      localidade,
      uf,
      estado,
      regiao,
      ibge,
      gia,
      ddd,
      siafi
    } = req.body;

    const ruaFinal = rua || logradouro;
    const cidadeFinal = cidade || localidade;

    if (
      !nome ||
      !data_nascimento ||
      !email ||
      !senha ||
      !cep ||
      !ruaFinal ||
      !numero ||
      !bairro ||
      !cidadeFinal ||
      !uf ||
      !estado ||
      !regiao
    ) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos obrigatorios."
      });
    }

    conexao = await pool.getConnection();

    await conexao.beginTransaction();

    const [usuarioExistente] = await conexao.query(
      `
      SELECT id
      FROM usuarios
      WHERE email = ?
      `,
      [email]
    );

    if (usuarioExistente.length > 0) {
      await conexao.rollback();

      return res.status(409).json({
        mensagem: "Este email ja esta cadastrado."
      });
    }

    const [usuario] = await conexao.query(
      `
      INSERT INTO usuarios
      (
        nome,
        data_nascimento,
        email,
        senha
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        nome,
        data_nascimento,
        email,
        senha
      ]
    );

    const idUsuario = usuario.insertId;

    await conexao.query(
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
        ruaFinal,
        numero,
        complemento || null,
        unidade || null,
        bairro,
        cidadeFinal,
        uf,
        estado,
        regiao,
        ibge || null,
        gia || null,
        ddd || null,
        siafi || null
      ]
    );

    await conexao.commit();

    res.status(201).json({
      mensagem: "Cadastro realizado com sucesso!",
      id_usuario: idUsuario
    });

  } catch (error) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao cadastrar cliente.",
      erro: error.message
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
});

/* =========================================================
   CLIENTE - EXCLUIR
========================================================= */

app.delete("/cadastros/:id", async function (req, res) {
  let conexao;

  try {
    const { id } = req.params;

    conexao = await pool.getConnection();

    await conexao.beginTransaction();

    const [usuario] = await conexao.query(
      `
      SELECT id
      FROM usuarios
      WHERE id = ?
      `,
      [id]
    );

    if (usuario.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        mensagem: "Cliente nao encontrado."
      });
    }

    await conexao.query(
      `
      DELETE FROM info_usuario
      WHERE id_usuario = ?
      `,
      [id]
    );

    await conexao.query(
      `
      DELETE FROM usuarios
      WHERE id = ?
      `,
      [id]
    );

    await conexao.commit();

    res.json({
      mensagem: "Cliente excluido com sucesso!"
    });

  } catch (error) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao excluir cliente.",
      erro: error.message
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
});

/* =========================================================
   QUARTOS - LISTAR
========================================================= */

app.get("/quartos", async function (req, res) {
  try {
    const [quartos] = await pool.query(`
      SELECT
        id,
        numero,
        tipo,
        preco_diaria,
        disponivel
      FROM quartos
      ORDER BY numero ASC
    `);

    res.json(quartos);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar quartos.",
      erro: error.message
    });
  }
});

/* =========================================================
   QUARTO - BUSCAR POR ID
========================================================= */

app.get("/quartos/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const [quartos] = await pool.query(
      `
      SELECT
        id,
        numero,
        tipo,
        preco_diaria,
        disponivel
      FROM quartos
      WHERE id = ?
      `,
      [id]
    );

    if (quartos.length === 0) {
      return res.status(404).json({
        mensagem: "Quarto nao encontrado."
      });
    }

    res.json(quartos[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar quarto.",
      erro: error.message
    });
  }
});

/* =========================================================
   QUARTO - CADASTRAR
========================================================= */

app.post("/quartos", async function (req, res) {
  try {
    const {
      numero,
      tipo,
      preco_diaria,
      disponivel
    } = req.body;

    if (
      !numero ||
      !tipo ||
      preco_diaria === undefined
    ) {
      return res.status(400).json({
        mensagem: "Preencha numero, tipo e preco_diaria."
      });
    }

    const [resultado] = await pool.query(
      `
      INSERT INTO quartos
      (
        numero,
        tipo,
        preco_diaria,
        disponivel
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        numero,
        tipo,
        preco_diaria,
        disponivel === undefined
          ? 1
          : Number(disponivel) === 1 ? 1 : 0
      ]
    );

    res.status(201).json({
      mensagem: "Quarto cadastrado com sucesso!",
      id: resultado.insertId
    });

  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem:
          "Este numero de quarto ja esta cadastrado."
      });
    }

    res.status(500).json({
      mensagem: "Erro ao cadastrar quarto.",
      erro: error.message
    });
  }
});

/* =========================================================
   QUARTO - ATUALIZAR
========================================================= */

app.put("/quartos/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const {
      numero,
      tipo,
      preco_diaria,
      disponivel
    } = req.body;

    if (
      !numero ||
      !tipo ||
      preco_diaria === undefined
    ) {
      return res.status(400).json({
        mensagem: "Preencha numero, tipo e preco_diaria."
      });
    }

    const [resultado] = await pool.query(
      `
      UPDATE quartos
      SET
        numero = ?,
        tipo = ?,
        preco_diaria = ?,
        disponivel = ?
      WHERE id = ?
      `,
      [
        numero,
        tipo,
        preco_diaria,
        Number(disponivel) === 1 ? 1 : 0,
        id
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Quarto nao encontrado."
      });
    }

    res.json({
      mensagem: "Quarto atualizado com sucesso!"
    });

  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem:
          "Este numero de quarto ja esta cadastrado."
      });
    }

    res.status(500).json({
      mensagem: "Erro ao atualizar quarto.",
      erro: error.message
    });
  }
});

/* =========================================================
   QUARTO - ALTERAR DISPONIBILIDADE
========================================================= */

app.patch(
  "/quartos/:id/disponibilidade",
  async function (req, res) {
    try {
      const { id } = req.params;
      const { disponivel } = req.body;

      if (disponivel === undefined) {
        return res.status(400).json({
          mensagem:
            "Informe a disponibilidade do quarto."
        });
      }

      const [resultado] = await pool.query(
        `
        UPDATE quartos
        SET disponivel = ?
        WHERE id = ?
        `,
        [
          Number(disponivel) === 1 ? 1 : 0,
          id
        ]
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          mensagem: "Quarto nao encontrado."
        });
      }

      res.json({
        mensagem:
          Number(disponivel) === 1
            ? "Quarto marcado como disponivel!"
            : "Quarto marcado como ocupado!"
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        mensagem:
          "Erro ao alterar disponibilidade.",
        erro: error.message
      });
    }
  }
);

/* =========================================================
   QUARTO - EXCLUIR
========================================================= */

app.delete("/quartos/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const [resultado] = await pool.query(
      `
      DELETE FROM quartos
      WHERE id = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Quarto nao encontrado."
      });
    }

    res.json({
      mensagem: "Quarto excluido com sucesso!"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao excluir quarto.",
      erro: error.message
    });
  }
});

/* =========================================================
   RESERVAS - LISTAR
========================================================= */

app.get("/reservas", async function (req, res) {
  try {
    const [reservas] = await pool.query(`
      SELECT
        r.id,
        r.id_usuario,
        r.id_quarto,
        r.data_entrada,
        r.data_saida,
        r.quantidade_hospedes,
        r.status,
        r.registrado_em,

        u.nome AS cliente_nome,
        u.email AS cliente_email,

        q.numero AS quarto_numero,
        q.tipo AS quarto_tipo,
        q.preco_diaria

      FROM reservas r

      INNER JOIN usuarios u
        ON r.id_usuario = u.id

      INNER JOIN quartos q
        ON r.id_quarto = q.id

      ORDER BY r.id DESC
    `);

    res.json(reservas);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar reservas.",
      erro: error.message
    });
  }
});

/* =========================================================
   RESERVA - BUSCAR POR ID
========================================================= */

app.get("/reservas/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const [reservas] = await pool.query(
      `
      SELECT
        r.id,
        r.id_usuario,
        r.id_quarto,
        r.data_entrada,
        r.data_saida,
        r.quantidade_hospedes,
        r.status,
        r.registrado_em,

        u.nome AS cliente_nome,
        u.email AS cliente_email,

        q.numero AS quarto_numero,
        q.tipo AS quarto_tipo,
        q.preco_diaria

      FROM reservas r

      INNER JOIN usuarios u
        ON r.id_usuario = u.id

      INNER JOIN quartos q
        ON r.id_quarto = q.id

      WHERE r.id = ?
      `,
      [id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        mensagem: "Reserva nao encontrada."
      });
    }

    res.json(reservas[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar reserva.",
      erro: error.message
    });
  }
});

/* =========================================================
   RESERVA - CRIAR
========================================================= */

app.post("/reservas", async function (req, res) {
  let conexao;

  try {
    const {
      id_usuario,
      id_quarto,
      data_entrada,
      data_saida,
      quantidade_hospedes
    } = req.body;

    if (
      !id_usuario ||
      !id_quarto ||
      !data_entrada ||
      !data_saida ||
      !quantidade_hospedes
    ) {
      return res.status(400).json({
        mensagem:
          "Preencha cliente, quarto, data de entrada, data de saida e quantidade de hospedes."
      });
    }

    if (data_saida <= data_entrada) {
      return res.status(400).json({
        mensagem:
          "A data de saida deve ser posterior a data de entrada."
      });
    }

    conexao = await pool.getConnection();

    await conexao.beginTransaction();

    const [usuarios] = await conexao.query(
      `
      SELECT
        id,
        nome
      FROM usuarios
      WHERE id = ?
      `,
      [id_usuario]
    );

    if (usuarios.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        mensagem: "Cliente nao encontrado."
      });
    }

    const [quartos] = await conexao.query(
      `
      SELECT
        id,
        numero,
        preco_diaria,
        disponivel
      FROM quartos
      WHERE id = ?
      FOR UPDATE
      `,
      [id_quarto]
    );

    if (quartos.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        mensagem: "Quarto nao encontrado."
      });
    }

    if (Number(quartos[0].disponivel) !== 1) {
      await conexao.rollback();

      return res.status(409).json({
        mensagem: "Este quarto esta ocupado."
      });
    }

    const [conflitos] = await conexao.query(
      `
      SELECT id
      FROM reservas
      WHERE id_quarto = ?
        AND status IN ('confirmada', 'pendente')
        AND data_entrada < ?
        AND data_saida > ?
      `,
      [
        id_quarto,
        data_saida,
        data_entrada
      ]
    );

    if (conflitos.length > 0) {
      await conexao.rollback();

      return res.status(409).json({
        mensagem:
          "Este quarto ja possui uma reserva nesse periodo."
      });
    }

    const [resultado] = await conexao.query(
      `
      INSERT INTO reservas
      (
        id_usuario,
        id_quarto,
        data_entrada,
        data_saida,
        quantidade_hospedes,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'confirmada')
      `,
      [
        id_usuario,
        id_quarto,
        data_entrada,
        data_saida,
        quantidade_hospedes
      ]
    );

    await conexao.query(
      `
      UPDATE quartos
      SET disponivel = 0
      WHERE id = ?
      `,
      [id_quarto]
    );

    await conexao.commit();

    res.status(201).json({
      mensagem: "Reserva criada com sucesso!",
      id: resultado.insertId
    });

  } catch (error) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao criar reserva.",
      erro: error.message
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
});

/* =========================================================
   RESERVA - ATUALIZAR
========================================================= */

app.put("/reservas/:id", async function (req, res) {
  let conexao;

  try {
    const { id } = req.params;

    const {
      id_usuario,
      id_quarto,
      data_entrada,
      data_saida,
      quantidade_hospedes,
      status
    } = req.body;

    if (
      !id_usuario ||
      !id_quarto ||
      !data_entrada ||
      !data_saida ||
      !quantidade_hospedes ||
      !status
    ) {
      return res.status(400).json({
        mensagem:
          "Preencha todos os campos da reserva."
      });
    }

    if (data_saida <= data_entrada) {
      return res.status(400).json({
        mensagem:
          "A data de saida deve ser posterior a data de entrada."
      });
    }

    conexao = await pool.getConnection();

    await conexao.beginTransaction();

    const [reservaAtual] = await conexao.query(
      `
      SELECT *
      FROM reservas
      WHERE id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (reservaAtual.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        mensagem: "Reserva nao encontrada."
      });
    }

    const quartoAntigo = reservaAtual[0].id_quarto;

    const [quartoNovo] = await conexao.query(
      `
      SELECT *
      FROM quartos
      WHERE id = ?
      FOR UPDATE
      `,
      [id_quarto]
    );

    if (quartoNovo.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        mensagem: "Quarto nao encontrado."
      });
    }

    if (
      Number(id_quarto) !== Number(quartoAntigo) &&
      status === "confirmada" &&
      Number(quartoNovo[0].disponivel) !== 1
    ) {
      await conexao.rollback();

      return res.status(409).json({
        mensagem: "O novo quarto esta ocupado."
      });
    }

    await conexao.query(
      `
      UPDATE reservas
      SET
        id_usuario = ?,
        id_quarto = ?,
        data_entrada = ?,
        data_saida = ?,
        quantidade_hospedes = ?,
        status = ?
      WHERE id = ?
      `,
      [
        id_usuario,
        id_quarto,
        data_entrada,
        data_saida,
        quantidade_hospedes,
        status,
        id
      ]
    );

    if (
      Number(id_quarto) !== Number(quartoAntigo)
    ) {
      await conexao.query(
        `
        UPDATE quartos
        SET disponivel = 1
        WHERE id = ?
        `,
        [quartoAntigo]
      );
    }

    if (status === "confirmada") {
      await conexao.query(
        `
        UPDATE quartos
        SET disponivel = 0
        WHERE id = ?
        `,
        [id_quarto]
      );
    }

    if (
      status === "cancelada" ||
      status === "finalizada"
    ) {
      await conexao.query(
        `
        UPDATE quartos
        SET disponivel = 1
        WHERE id = ?
        `,
        [id_quarto]
      );
    }

    await conexao.commit();

    res.json({
      mensagem: "Reserva atualizada com sucesso!"
    });

  } catch (error) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao atualizar reserva.",
      erro: error.message
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
});

/* =========================================================
   RESERVA - CANCELAR
========================================================= */

app.patch(
  "/reservas/:id/cancelar",
  async function (req, res) {
    let conexao;

    try {
      const { id } = req.params;

      conexao = await pool.getConnection();

      await conexao.beginTransaction();

      const [reservas] = await conexao.query(
        `
        SELECT
          id_quarto,
          status
        FROM reservas
        WHERE id = ?
        FOR UPDATE
        `,
        [id]
      );

      if (reservas.length === 0) {
        await conexao.rollback();

        return res.status(404).json({
          mensagem: "Reserva nao encontrada."
        });
      }

      if (reservas[0].status === "cancelada") {
        await conexao.rollback();

        return res.status(400).json({
          mensagem:
            "Esta reserva ja esta cancelada."
        });
      }

      await conexao.query(
        `
        UPDATE reservas
        SET status = 'cancelada'
        WHERE id = ?
        `,
        [id]
      );

      await conexao.query(
        `
        UPDATE quartos
        SET disponivel = 1
        WHERE id = ?
        `,
        [reservas[0].id_quarto]
      );

      await conexao.commit();

      res.json({
        mensagem:
          "Reserva cancelada com sucesso!"
      });

    } catch (error) {
      if (conexao) {
        await conexao.rollback();
      }

      console.error(error);

      res.status(500).json({
        mensagem:
          "Erro ao cancelar reserva.",
        erro: error.message
      });

    } finally {
      if (conexao) {
        conexao.release();
      }
    }
  }
);

/* =========================================================
   INICIAR SERVIDOR
========================================================= */

app.listen(PORT, function () {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );
});