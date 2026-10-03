import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { OAuth2Client } from "google-auth-library";

const app = express();

const PORT = 3001;

/* =========================================================
   GOOGLE
========================================================= */

const GOOGLE_CLIENT_ID =
  "124183329443-7e6lu1jrdlqhkm15ofjstfi9j9emhnuq.apps.googleusercontent.com";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   BANCO DE DADOS
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
   TESTE DO SERVIDOR
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
   CLIENTES - LISTAR
========================================================= */

app.get("/cadastros", async function (req, res) {
  try {
    const [clientes] = await pool.query(`
      SELECT
        u.id,
        u.nome,
        u.data_nascimento,
        u.email,
        u.senha,
        u.google_id,
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
        ON i.id_usuario = u.id
      ORDER BY u.id DESC
    `);

    res.json(clientes);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar clientes.",
      erro: error.message
    });
  }
});

/* =========================================================
   CLIENTE - BUSCAR POR ID
========================================================= */

app.get("/cadastros/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const [clientes] = await pool.query(
      `
      SELECT
        u.id,
        u.nome,
        u.data_nascimento,
        u.email,
        u.senha,
        u.google_id,
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
        ON i.id_usuario = u.id
      WHERE u.id = ?
      `,
      [id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        mensagem: "Cliente nao encontrado."
      });
    }

    res.json(clientes[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar cliente.",
      erro: error.message
    });
  }
});

/* =========================================================
   CLIENTE - CADASTRAR
========================================================= */

app.post("/cadastros", async function (req, res) {
  const conexao = await pool.getConnection();

  try {
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
      conexao.release();

      return res.status(400).json({
        mensagem: "Preencha os campos obrigatorios."
      });
    }

    await conexao.beginTransaction();

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

    await conexao.commit();
    conexao.release();

    res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso!",
      id: idUsuario
    });

  } catch (error) {
    await conexao.rollback();
    conexao.release();

    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este e-mail ja esta cadastrado."
      });
    }

    res.status(500).json({
      mensagem: "Erro ao cadastrar cliente.",
      erro: error.message
    });
  }
});

/* =========================================================
   CLIENTE - ATUALIZAR
========================================================= */

app.put("/cadastros/:id", async function (req, res) {
  const conexao = await pool.getConnection();

  try {
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

    const [clientes] = await conexao.query(
      "SELECT id FROM usuarios WHERE id = ?",
      [id]
    );

    if (clientes.length === 0) {
      conexao.release();

      return res.status(404).json({
        mensagem: "Cliente nao encontrado."
      });
    }

    await conexao.beginTransaction();

    if (senha) {
      await conexao.query(
        `
        UPDATE usuarios
        SET
          nome = ?,
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
      await conexao.query(
        `
        UPDATE usuarios
        SET
          nome = ?,
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

    await conexao.query(
      `
      UPDATE info_usuario
      SET
        cep = ?,
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

    await conexao.commit();
    conexao.release();

    res.json({
      mensagem: "Cliente atualizado com sucesso!"
    });

  } catch (error) {
    await conexao.rollback();
    conexao.release();

    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este e-mail ja esta cadastrado."
      });
    }

    res.status(500).json({
      mensagem: "Erro ao atualizar cliente.",
      erro: error.message
    });
  }
});

/* =========================================================
   CLIENTE - EXCLUIR
========================================================= */

app.delete("/cadastros/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const [resultado] = await pool.query(
      "DELETE FROM usuarios WHERE id = ?",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Cliente nao encontrado."
      });
    }

    res.json({
      mensagem: "Cliente excluido com sucesso!"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao excluir cliente.",
      erro: error.message
    });
  }
});

/* =========================================================
   PUT /ENDERECO
========================================================= */

app.put("/endereco", async function (req, res) {
  try {
    const {
      id_usuario,
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

    if (!id_usuario) {
      return res.status(400).json({
        mensagem: "Informe o id_usuario."
      });
    }

    const [usuario] = await pool.query(
      "SELECT id FROM usuarios WHERE id = ?",
      [id_usuario]
    );

    if (usuario.length === 0) {
      return res.status(404).json({
        mensagem: "Usuario nao encontrado."
      });
    }

    const [endereco] = await pool.query(
      "SELECT id_usuario FROM info_usuario WHERE id_usuario = ?",
      [id_usuario]
    );

    if (endereco.length === 0) {
      await pool.query(
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
          id_usuario,
          cep || null,
          rua || null,
          numero || null,
          complemento || null,
          unidade || null,
          bairro || null,
          cidade || null,
          uf || null,
          estado || null,
          regiao || null,
          ibge || null,
          gia || null,
          ddd || null,
          siafi || null
        ]
      );
    } else {
      await pool.query(
        `
        UPDATE info_usuario
        SET
          cep = ?,
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
          cep || null,
          rua || null,
          numero || null,
          complemento || null,
          unidade || null,
          bairro || null,
          cidade || null,
          uf || null,
          estado || null,
          regiao || null,
          ibge || null,
          gia || null,
          ddd || null,
          siafi || null,
          id_usuario
        ]
      );
    }

    res.json({
      mensagem: "Endereco atualizado com sucesso!"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao atualizar endereco.",
      erro: error.message
    });
  }
});

/* =========================================================
   VIA CEP
========================================================= */

app.get("/cep/:cep", async function (req, res) {
  try {
    const cep = req.params.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      return res.status(400).json({
        mensagem: "CEP invalido."
      });
    }

    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    const data = await resposta.json();

    if (data.erro) {
      return res.status(404).json({
        mensagem: "CEP nao encontrado."
      });
    }

    res.json({
      cep: data.cep || "",
      rua: data.logradouro || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
      estado: data.estado || "",
      regiao: data.regiao || "",
      ibge: data.ibge || "",
      gia: data.gia || "",
      ddd: data.ddd || "",
      siafi: data.siafi || ""
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao consultar ViaCEP.",
      erro: error.message
    });
  }
});

/* =========================================================
   HOTEIS - LISTAR
========================================================= */

app.get("/hoteis", async function (req, res) {
  try {
    const [hoteis] = await pool.query(
      "SELECT * FROM hoteis ORDER BY id DESC"
    );

    res.json(hoteis);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar hoteis.",
      erro: error.message
    });
  }
});

/* =========================================================
   HOTEIS - CADASTRAR
========================================================= */

app.post("/hoteis", async function (req, res) {
  try {
    const {
      nome,
      endereco,
      cidade,
      telefone,
      preco_diaria
    } = req.body;

    if (
      !nome ||
      !endereco ||
      !cidade ||
      !telefone ||
      !preco_diaria
    ) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos."
      });
    }

    const [resultado] = await pool.query(
      `
      INSERT INTO hoteis
      (
        nome,
        endereco,
        cidade,
        telefone,
        preco_diaria
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nome,
        endereco,
        cidade,
        telefone,
        preco_diaria
      ]
    );

    res.status(201).json({
      mensagem: "Hotel cadastrado com sucesso!",
      id: resultado.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao cadastrar hotel.",
      erro: error.message
    });
  }
});

/* =========================================================
   HOTEIS - ATUALIZAR
========================================================= */

app.put("/hoteis/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const {
      nome,
      endereco,
      cidade,
      telefone,
      preco_diaria
    } = req.body;

    const [resultado] = await pool.query(
      `
      UPDATE hoteis
      SET
        nome = ?,
        endereco = ?,
        cidade = ?,
        telefone = ?,
        preco_diaria = ?
      WHERE id = ?
      `,
      [
        nome,
        endereco,
        cidade,
        telefone,
        preco_diaria,
        id
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Hotel nao encontrado."
      });
    }

    res.json({
      mensagem: "Hotel atualizado com sucesso!"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao atualizar hotel.",
      erro: error.message
    });
  }
});

/* =========================================================
   HOTEIS - EXCLUIR
========================================================= */

app.delete("/hoteis/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const [resultado] = await pool.query(
      "DELETE FROM hoteis WHERE id = ?",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Hotel nao encontrado."
      });
    }

    res.json({
      mensagem: "Hotel excluido com sucesso!"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao excluir hotel.",
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
        email,
        senha
      FROM usuarios
      WHERE email = ?
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

app.post("/login/google", async function (req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        mensagem: "Token do Google nao informado."
      });
    }

    /* =====================================================
       VERIFICAR ID TOKEN DO GOOGLE
    ===================================================== */

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        mensagem: "Token do Google invalido."
      });
    }

    const googleId = payload.sub;
    const nome = payload.name || "";
    const email = payload.email || "";
    const foto = payload.picture || "";

    if (!email) {
      return res.status(400).json({
        mensagem: "O Google nao retornou um e-mail."
      });
    }

    /* =====================================================
       PROCURAR USUARIO PELO E-MAIL
    ===================================================== */

    const [usuarios] = await pool.query(
      `
      SELECT
        id,
        nome,
        email,
        google_id
      FROM usuarios
      WHERE email = ?
      `,
      [email]
    );

    /* =====================================================
       USUARIO JA EXISTE
    ===================================================== */

    if (usuarios.length > 0) {
      const usuario = usuarios[0];

      /* Se ainda nao tiver google_id, associar */
      if (!usuario.google_id) {
        await pool.query(
          `
          UPDATE usuarios
          SET google_id = ?
          WHERE id = ?
          `,
          [
            googleId,
            usuario.id
          ]
        );
      }

      return res.json({
        mensagem: "Login com Google realizado com sucesso!",
        novoCadastro: false,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          googleId,
          foto
        }
      });
    }

    /* =====================================================
       CRIAR NOVO USUARIO GOOGLE
    ===================================================== */

    const [resultado] = await pool.query(
      `
      INSERT INTO usuarios
      (
        nome,
        email,
        google_id
      )
      VALUES (?, ?, ?)
      `,
      [
        nome,
        email,
        googleId
      ]
    );

    const novoUsuarioId = resultado.insertId;

    return res.status(201).json({
      mensagem: "Cadastro com Google realizado com sucesso!",
      novoCadastro: false,
      usuario: {
        id: novoUsuarioId,
        nome,
        email,
        googleId,
        foto
      }
    });

  } catch (error) {
    console.error(
      "Erro no login com Google:",
      error
    );

    res.status(401).json({
      mensagem: "Nao foi possivel autenticar com o Google.",
      erro: error.message
    });
  }
});

/* =========================================================
   LOGOUT
========================================================= */

app.post("/logout", function (req, res) {
  res.json({
    mensagem: "Logout realizado com sucesso!"
  });
});

/* =========================================================
   INICIAR SERVIDOR
========================================================= */

app.listen(PORT, function () {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );
});