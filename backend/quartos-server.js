import express from "express";
import cors from "cors";
import quartosRouter from "./routes/quartos.js";

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API de Quartos funcionando!"
  });
});

app.use("/quartos", quartosRouter);

app.listen(PORT, () => {
  console.log(`Servidor de quartos rodando em http://localhost:${PORT}`);
});