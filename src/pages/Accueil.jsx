import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_CLIENTES = "http://localhost:3001/cadastros";
const API_QUARTOS = "http://localhost:3002/quartos";


function sair() {
  localStorage.removeItem("usuario");
  window.location.href = "/login";
}

function Accueil() {
  const usuario = localStorage.getItem("usuario");

  if (!usuario) {
    window.location.href = "/login";
    return null;
  }

  const [clientes, setClientes] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [mostrarFormQuarto, setMostrarFormQuarto] = useState(false);
 const [quartoEditando, setQuartoEditando] = useState(null);

const [formQuarto, setFormQuarto] = useState({
    numero: "",
    tipo: "Solteiro",
    preco_diaria: "",
    disponivel: 1
  });

  useEffect(() => {
    carregarClientes();
    carregarQuartos();
  }, []);

  async function carregarClientes() {
    try {
      const resposta = await fetch(API_CLIENTES);
      const dados = await resposta.json();
      setClientes(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      console.error("Erro ao carregar clientes:", erro);
    }
  }

  async function carregarQuartos() {
    try {
      const resposta = await fetch(API_QUARTOS);
      const dados = await resposta.json();
      setQuartos(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      console.error("Erro ao carregar quartos:", erro);
    }
  }

  function abrirNovoQuarto() {
    setQuartoEditando(null);

    setFormQuarto({
      numero: "",
      tipo: "Solteiro",
      preco_diaria: "",
      disponivel: 1
    });

    setMostrarFormQuarto(true);
  }

  function abrirEditarQuarto(quarto) {
    setQuartoEditando(quarto);

    setFormQuarto({
      numero: quarto.numero,
      tipo: quarto.tipo,
      preco_diaria: quarto.preco_diaria,
      disponivel: quarto.disponivel
    });

    setMostrarFormQuarto(true);
  }

  function fecharFormQuarto() {
    setMostrarFormQuarto(false);
    setQuartoEditando(null);
  }

  function alterarFormQuarto(evento) {
    const { name, value } = evento.target;

    setFormQuarto((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  async function salvarQuarto(evento) {
    evento.preventDefault();

    try {
      const metodo = quartoEditando ? "PUT" : "POST";

      const url = quartoEditando
        ? `${API_QUARTOS}/${quartoEditando.id}`
        : API_QUARTOS;

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          numero: formQuarto.numero,
          tipo: formQuarto.tipo,
          preco_diaria: Number(formQuarto.preco_diaria),
          disponivel: Number(formQuarto.disponivel)
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(dados.mensagem || "Erro ao salvar quarto.");
        return;
      }

      alert(
        quartoEditando
          ? "Quarto atualizado com sucesso!"
          : "Quarto criado com sucesso!"
      );

      fecharFormQuarto();
      carregarQuartos();
    } catch (erro) {
      console.error("Erro ao salvar quarto:", erro);
      alert("Erro de conexão com o servidor.");
    }
  }

  async function excluirQuarto(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este quarto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await fetch(`${API_QUARTOS}/${id}`, {
        method: "DELETE"
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(dados.mensagem || "Erro ao excluir quarto.");
        return;
      }

      alert("Quarto excluído com sucesso!");
      carregarQuartos();
    } catch (erro) {
      console.error("Erro ao excluir quarto:", erro);
      alert("Erro de conexão com o servidor.");
    }
  }

  async function alternarDisponibilidade(quarto) {
    try {
      const resposta = await fetch(`${API_QUARTOS}/${quarto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          numero: quarto.numero,
          tipo: quarto.tipo,
          preco_diaria: Number(quarto.preco_diaria),
          disponivel: Number(quarto.disponivel) === 1 ? 0 : 1
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(dados.mensagem || "Erro ao alterar disponibilidade.");
        return;
      }

      carregarQuartos();
    } catch (erro) {
      console.error("Erro ao alterar disponibilidade:", erro);
      alert("Erro de conexão com o servidor.");
    }
  }

  async function excluirCliente(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este cliente?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await fetch(`${API_CLIENTES}/${id}`, {
        method: "DELETE"
      });

      if (!resposta.ok) {
        alert("Erro ao excluir cliente.");
        return;
      }

      alert("Cliente excluído com sucesso!");
      carregarClientes();
    } catch (erro) {
      console.error("Erro ao excluir cliente:", erro);
      alert("Erro de conexão com o servidor.");
    }
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busca.toLowerCase();

    return (
      String(cliente.nome || "").toLowerCase().includes(texto) ||
      String(cliente.email || "").toLowerCase().includes(texto) ||
      String(cliente.cpf || "").toLowerCase().includes(texto)
    );
  });

  const totalQuartos = quartos.length;

  const quartosDisponiveis = quartos.filter(
    (quarto) => Number(quarto.disponivel) === 1
  ).length;

  const quartosOcupados = quartos.filter(
    (quarto) => Number(quarto.disponivel) === 0
  ).length;

  return (
    <>
      <header className="topo">
        <div className="logo-area">
          <h1>Hotel</h1>
          <p>Sistema de Cadastro</p>
        </div>

      <nav>
  <Link to="/">Início</Link>
  <Link to="/cadastro">Novo cadastro</Link>
  <button type="button" className="botao-sair" onClick={sair}>
  Sair
</button>
</nav>
      </header>

      <main className="container">

        <section className="hero">
          <div>
            <span className="numero-sistema">01</span>
            <h2>SISTEMA DE CADASTRO</h2>
            <p>Sistema online</p>
          </div>
        </section>

        <section className="estatisticas">

          <div className="estatistica">
            <span className="icone">👥</span>
            <strong>{clientes.length}</strong>
            <small>TOTAL DE CLIENTES</small>
          </div>

          <div className="estatistica">
            <span className="icone">🏨</span>
            <strong>{totalQuartos}</strong>
            <small>TOTAL DE QUARTOS</small>
          </div>

          <div className="estatistica">
            <span className="icone">🟢</span>
            <strong>{quartosDisponiveis}</strong>
            <small>QUARTOS DISPONÍVEIS</small>
          </div>

          <div className="estatistica">
            <span className="icone">🔴</span>
            <strong>{quartosOcupados}</strong>
            <small>QUARTOS OCUPADOS</small>
          </div>

        </section>

        <section className="info-grid">

          <div className="info-card">
            <strong>SISTEMA</strong>
            <span>API / Express + MySQL</span>
          </div>

          <div className="info-card">
            <strong>ENDEREÇO</strong>
            <span>CEP / ViaCEP integrado</span>
          </div>

          <div className="info-card">
            <strong>QUARTOS</strong>
            <span>Controle de disponibilidade</span>
          </div>

        </section>

        <section className="secao">

          <div className="secao-cabecalho">
            <div>
              <h2>Quartos do Hotel</h2>
              <p>Lista de quartos e disponibilidade</p>
            </div>

            <button
              className="botao-principal"
              onClick={abrirNovoQuarto}
            >
              + Novo quarto
            </button>
          </div>

          {quartos.length === 0 ? (
            <div className="vazio">
              Nenhum quarto cadastrado.
            </div>
          ) : (
            <div className="quartos-grid">

              {quartos.map((quarto) => (
                <article
                  className="quarto-card"
                  key={quarto.id}
                >

                  <div className="quarto-topo">
                    <span>QUARTO</span>
                    <strong>{quarto.numero}</strong>
                  </div>

                  <div
                    className={
                      Number(quarto.disponivel) === 1
                        ? "status disponivel"
                        : "status ocupado"
                    }
                  >
                    {Number(quarto.disponivel) === 1
                      ? "Disponível"
                      : "Ocupado"}
                  </div>

                  <p>
                    <strong>Tipo:</strong>{" "}
                    {quarto.tipo}
                  </p>

                  <p>
                    <strong>Diária:</strong>{" "}
                    {Number(
                      quarto.preco_diaria
                    ).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    })}
                  </p>

                  <div className="quarto-acoes">

                    <button
                      className="botao-editar"
                      onClick={() =>
                        abrirEditarQuarto(quarto)
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="botao-status"
                      onClick={() =>
                        alternarDisponibilidade(quarto)
                      }
                    >
                      {Number(quarto.disponivel) === 1
                        ? "Ocupar"
                        : "Liberar"}
                    </button>

                    <button
                      className="botao-excluir"
                      onClick={() =>
                        excluirQuarto(quarto.id)
                      }
                    >
                      Excluir
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        <section className="secao">

          <div className="secao-cabecalho">

            <div>
              <h2>Clientes cadastrados</h2>
              <p>
                Consulte os clientes registrados no sistema
              </p>
            </div>

            <input
              className="campo-busca"
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

          </div>

          <div className="clientes-grid">

            {clientesFiltrados.map((cliente) => (
              <article
                className="cliente-card"
                key={cliente.id}
              >

                <span className="cliente-id">
                  #{cliente.id}
                </span>

                <h3>{cliente.nome}</h3>

                <p>
                  <strong>E-mail:</strong>{" "}
                  {cliente.email}
                </p>

                <p>
                  <strong>Endereço:</strong>{" "}
                  {cliente.rua || "-"},{" "}
                  {cliente.numero || "-"}
                </p>

                <p>
                  <strong>Complemento:</strong>{" "}
                  {cliente.complemento || "-"}
                </p>

                <p>
                  <strong>Bairro:</strong>{" "}
                  {cliente.bairro || "-"}
                </p>

                <p>
                  <strong>Localidade:</strong>{" "}
                  {cliente.cidade || "-"} -{" "}
                  {cliente.estado || "-"} -{" "}
                  {cliente.uf || "-"}
                </p>

                <p>
                  <strong>CEP:</strong>{" "}
                  {cliente.cep || "-"}
                </p>

                <div className="cliente-acoes">

                  <button
                    className="botao-detalhes"
                    onClick={() =>
                      setClienteSelecionado(cliente)
                    }
                  >
                    Ver detalhes
                  </button>

                  <button
                    className="botao-excluir"
                    onClick={() =>
                      excluirCliente(cliente.id)
                    }
                  >
                    Excluir
                  </button>

                </div>

              </article>
            ))}

          </div>

        </section>

      </main>

      {mostrarFormQuarto && (
        <div className="modal-fundo">

          <div className="modal">

            <div className="modal-cabecalho">

              <div>
                <h2>
                  {quartoEditando
                    ? "Editar quarto"
                    : "Novo quarto"}
                </h2>

                <p>
                  Preencha os dados do quarto
                </p>
              </div>

              <button
                className="modal-fechar"
                onClick={fecharFormQuarto}
              >
                ×
              </button>

            </div>

            <form onSubmit={salvarQuarto}>

              <label>
                Número do quarto

                <input
                  type="text"
                  name="numero"
                  value={formQuarto.numero}
                  onChange={alterarFormQuarto}
                  placeholder="Ex.: 402"
                  required
                />
              </label>

              <label>
                Tipo

                <select
                  name="tipo"
                  value={formQuarto.tipo}
                  onChange={alterarFormQuarto}
                >
                  <option value="Solteiro">
                    Solteiro
                  </option>

                  <option value="Duplo">
                    Duplo
                  </option>

                  <option value="Luxo">
                    Luxo
                  </option>

                  <option value="Suíte">
                    Suíte
                  </option>
                </select>
              </label>

              <label>
                Diária

                <input
                  type="number"
                  name="preco_diaria"
                  value={formQuarto.preco_diaria}
                  onChange={alterarFormQuarto}
                  placeholder="Ex.: 250"
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <label>
                Disponibilidade

                <select
                  name="disponivel"
                  value={formQuarto.disponivel}
                  onChange={alterarFormQuarto}
                >
                  <option value="1">
                    Disponível
                  </option>

                  <option value="0">
                    Ocupado
                  </option>
                </select>
              </label>

              <div className="form-acoes">

                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={fecharFormQuarto}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="botao-principal"
                >
                  {quartoEditando
                    ? "Salvar alterações"
                    : "Criar quarto"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {clienteSelecionado && (
        <div
          className="modal-fundo"
          onClick={() =>
            setClienteSelecionado(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-cabecalho">

              <div>
                <h2>
                  {clienteSelecionado.nome}
                </h2>

                <p>Detalhes do cliente</p>
              </div>

              <button
                className="modal-fechar"
                onClick={() =>
                  setClienteSelecionado(null)
                }
              >
                ×
              </button>

            </div>

            <div className="detalhes">

              <p>
                <strong>ID:</strong>{" "}
                {clienteSelecionado.id}
              </p>

              <p>
                <strong>Nome:</strong>{" "}
                {clienteSelecionado.nome}
              </p>

              <p>
                <strong>E-mail:</strong>{" "}
                {clienteSelecionado.email}
              </p>

              <p>
                <strong>CPF:</strong>{" "}
                {clienteSelecionado.cpf || "-"}
              </p>

              <p>
                <strong>Telefone:</strong>{" "}
                {clienteSelecionado.telefone || "-"}
              </p>

              <p>
                <strong>Endereço:</strong>{" "}
                {clienteSelecionado.rua || "-"},{" "}
                {clienteSelecionado.numero || "-"}
              </p>

              <p>
                <strong>Complemento:</strong>{" "}
                {clienteSelecionado.complemento || "-"}
              </p>

              <p>
                <strong>Bairro:</strong>{" "}
                {clienteSelecionado.bairro || "-"}
              </p>

              <p>
                <strong>Cidade:</strong>{" "}
                {clienteSelecionado.cidade || "-"}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {clienteSelecionado.estado || "-"}
              </p>

              <p>
                <strong>UF:</strong>{" "}
                {clienteSelecionado.uf || "-"}
              </p>

              <p>
                <strong>CEP:</strong>{" "}
                {clienteSelecionado.cep || "-"}
              </p>

            </div>

          </div>

        </div>
      )}

    </>
  );
}

export default Accueil;