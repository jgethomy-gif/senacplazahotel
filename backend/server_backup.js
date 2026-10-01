import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();

const PORT = 3001;

app.use(cors());
app.use(express.json());

/* =========================================================
   BANCO DE DADOS
========================================================= */

const pool = mysql.createPool({
  host: "localhost",
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
    const [resultado] = await pool.query("SELECT 1 AS teste");

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
    const [clientes] = await pool.query(
      "SELECT * FROM cadastros ORDER BY id DESC"
    );

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
      "SELECT * FROM cadastros WHERE id = ?",
      [id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        mensagem: "Cliente não encontrado."
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
      !uf
    ) {
      return res.status(400).json({
        mensagem: "Preencha os campos obrigatórios."
      });
    }

    const [resultado] = await pool.query(
      `
      INSERT INTO cadastros
      (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nome,
        data_nascimento,
        email,
        senha,
        cep,
        rua,
        numero,
        complemento || null,
        unidade || null,
        bairro,
        cidade,
        uf,
        estado || null,
        regiao || null,
        ibge || null,
        gia || null,
        ddd || null,
        siafi || null
      ]
    );

    res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso!",
      id: resultado.insertId
    });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este e-mail já está cadastrado."
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

    const [clientes] = await pool.query(
      "SELECT * FROM cadastros WHERE id = ?",
      [id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({
        mensagem: "Cliente não encontrado."
      });
    }

    if (senha) {
      await pool.query(
        `
        UPDATE cadastros
        SET
          nome = ?,
          data_nascimento = ?,
          email = ?,
          senha = ?,
          cep = ?,
          rua = ?,
          numero = ?,
          complemento = ?,
          unidade = ?,
          bairro = ?,
          cidade = ?,
          uf = ?,
          estado = ?,
          regiao = ?,
          ibge = ?,
          gia = ?,
          ddd = ?,
          siafi = ?
        WHERE id = ?
        `,
        [
          nome,
          data_nascimento,
          email,
          senha,
          cep,
          rua,
          numero,
          complemento || null,
          unidade || null,
          bairro,
          cidade,
          uf,
          estado || null,
          regiao || null,
          ibge || null,
          gia || null,
          ddd || null,
          siafi || null,
          id
        ]
      );
    } else {
      await pool.query(
        `
        UPDATE cadastros
        SET
          nome = ?,
          data_nascimento = ?,
          email = ?,
          cep = ?,
          rua = ?,
          numero = ?,
          complemento = ?,
          unidade = ?,
          bairro = ?,
          cidade = ?,
          uf = ?,
          estado = ?,
          regiao = ?,
          ibge = ?,
          gia = ?,
          ddd = ?,
          siafi = ?
        WHERE id = ?
        `,
        [
          nome,
          data_nascimento,
          email,
          cep,
          rua,
          numero,
          complemento || null,
          unidade || null,
          bairro,
          cidade,
          uf,
          estado || null,
          regiao || null,
          ibge || null,
          gia || null,
          ddd || null,
          siafi || null,
          id
        ]
      );
    }

    res.json({
      mensagem: "Cliente atualizado com sucesso!"
    });
  } catch (error) {
    console.error(error);

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
      "DELETE FROM cadastros WHERE id = ?",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Cliente não encontrado."
      });
    }

    res.json({
      mensagem: "Cliente excluído com sucesso!"
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
   VIA CEP
========================================================= */

app.get("/cep/:cep", async function (req, res) {
  try {
    const cep = req.params.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      return res.status(400).json({
        mensagem: "CEP inválido."
      });
    }

    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    const data = await resposta.json();

    if (data.erro) {
      return res.status(404).json({
        mensagem: "CEP não encontrado."
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
   HOTÉIS - LISTAR
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
      mensagem: "Erro ao buscar hotéis.",
      erro: error.message
    });
  }
});

/* =========================================================
   HOTÉIS - CADASTRAR
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
   HOTÉIS - ATUALIZAR
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
        mensagem: "Hotel não encontrado."
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
   HOTÉIS - EXCLUIR
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
        mensagem: "Hotel não encontrado."
      });
    }

    res.json({
      mensagem: "Hotel excluído com sucesso!"
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
   INICIAR SERVIDOR
========================================================= */

app.listen(PORT, function () {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});