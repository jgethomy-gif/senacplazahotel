const mysql = require("mysql2/promise");

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    port: 3306
  });

  await connection.query(`
    CREATE DATABASE IF NOT EXISTS SenacPlazaHotel
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `);

  console.log("Banco SenacPlazaHotel criado com sucesso!");

  await connection.end();
}

createDatabase().catch((error) => {
  console.error("Erro:", error.message);
});