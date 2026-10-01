const express = require("express");

const router = express.Router();

let hoteis = [
  {
    id: 1,
    nome: "Hotel São Paulo",
    endereco: "Avenida Paulista, 1000",
    cidade: "São Paulo",
    telefone: "(11) 99999-9999",
    preco_diaria: 250
  },
  {
    id: 2,
    nome: "Hotel Central",
    endereco: "Rua Augusta, 500",
    cidade: "São Paulo",
    telefone: "(11) 98888-8888",
    preco_diaria: 180
  }
];

// Listar todos os hotéis
router.get("/", (req, res) => {
  res.json(hoteis);
});

// Buscar hotel por ID
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const hotel = hoteis.find((item) => item.id === id);

  if (!hotel) {
    return res.status(404).json({
      mensagem: "Hotel não encontrado."
    });
  }

  res.json(hotel);
});

// Cadastrar hotel
router.post("/", (req, res) => {
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
      mensagem: "Todos os campos são obrigatórios."
    });
  }

  const novoHotel = {
    id: hoteis.length > 0
      ? hoteis[hoteis.length - 1].id + 1
      : 1,
    nome,
    endereco,
    cidade,
    telefone,
    preco_diaria: Number(preco_diaria)
  };

  hoteis.push(novoHotel);

  res.status(201).json({
    mensagem: "Hotel cadastrado com sucesso!",
    hotel: novoHotel
  });
});

// Atualizar hotel
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);

  const hotel = hoteis.find((item) => item.id === id);

  if (!hotel) {
    return res.status(404).json({
      mensagem: "Hotel não encontrado."
    });
  }

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
      mensagem: "Todos os campos são obrigatórios."
    });
  }

  hotel.nome = nome;
  hotel.endereco = endereco;
  hotel.cidade = cidade;
  hotel.telefone = telefone;
  hotel.preco_diaria = Number(preco_diaria);

  res.json({
    mensagem: "Hotel atualizado com sucesso!",
    hotel
  });
});

// Excluir hotel
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  const indice = hoteis.findIndex((item) => item.id === id);

  if (indice === -1) {
    return res.status(404).json({
      mensagem: "Hotel não encontrado."
    });
  }

  const hotelRemovido = hoteis.splice(indice, 1)[0];

  res.json({
    mensagem: "Hotel removido com sucesso!",
    hotel: hotelRemovido
  });
});

module.exports = router;