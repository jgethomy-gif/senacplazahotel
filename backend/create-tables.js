const mysql = require("mysql2/promise");

async function createTables() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "SenacPlazaHotel",
    port: 3306
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      data_nascimento DATE NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      registrado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS info_usuario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL UNIQUE,
      cep CHAR(9) NOT NULL,
      logradouro VARCHAR(150) NOT NULL,
      numero VARCHAR(10) NOT NULL,
      complemento VARCHAR(150),
      unidade VARCHAR(100),
      bairro VARCHAR(100) NOT NULL,
      localidade VARCHAR(100) NOT NULL,
      uf CHAR(2) NOT NULL,
      estado VARCHAR(100) NOT NULL,
      regiao VARCHAR(50) NOT NULL,
      ibge VARCHAR(10),
      gia VARCHAR(10),
      ddd VARCHAR(3),
      siafi VARCHAR(10),
      FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS quartos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero VARCHAR(10) NOT NULL UNIQUE,
      tipo VARCHAR(50) NOT NULL,
      preco_diaria DECIMAL(10,2) NOT NULL,
      disponivel BOOLEAN DEFAULT TRUE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_quarto INT NOT NULL,
      data_entrada DATE NOT NULL,
      data_saida DATE NOT NULL,
      quantidade_hospedes INT NOT NULL DEFAULT 1,
      status ENUM(
        'pendente',
        'confirmada',
        'cancelada',
        'finalizada'
      ) DEFAULT 'pendente',
      registrado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
      FOREIGN KEY (id_quarto)
        REFERENCES quartos(id)
    )
  `);

  await connection.query(`
    CREATE OR REPLACE VIEW view_informacoes AS
    SELECT
      reservas.id AS id_reserva,
      usuarios.id AS id_usuario,
      usuarios.nome AS nome_usuario,
      quartos.id AS id_quarto,
      quartos.numero AS numero_quarto,
      quartos.tipo AS tipo_quarto,
      reservas.data_entrada,
      reservas.data_saida,
      reservas.quantidade_hospedes,
      reservas.status,
      reservas.registrado_em
    FROM reservas
    INNER JOIN usuarios
      ON reservas.id_usuario = usuarios.id
    INNER JOIN quartos
      ON reservas.id_quarto = quartos.id
  `);

  console.log("Tabelas e VIEW criadas com sucesso!");

  await connection.end();
}

createTables().catch((error) => {
  console.error("Erro:", error.message);
});