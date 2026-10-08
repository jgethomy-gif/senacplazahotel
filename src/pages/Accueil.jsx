
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_CLIENTES = "http://localhost:3001/cadastros";
const API_QUARTOS = "http://localhost:3001/quartos";

function sair() {
  localStorage.removeItem("usuario");
  window.location.href = "/login";
}

function Accueil() {
  const usuario = localStorage.getItem("usuario");

  const [clientes, setClientes] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [busca, setBusca] = useState("");
  const [erroClientes, setErroClientes] = useState("");

  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [mostrarFormQuarto, setMostrarFormQuarto] = useState(false);
  const [quartoEditando, setQuartoEditando] = useState(null);

  const [formQuarto, setFormQuarto] = useState({
    numero: "",
    tipo: "Solteiro",
    preco_diaria: "",
    disponivel: 1,
  });

  useEffect(() => {
    if (!usuario) {
      window.location.href = "/login";
      return;
    }

    carregarClientes();
    carregarQuartos();
  }, [usuario]);

  /* =========================================================
     CLIENTES
  ========================================================= */

  async function carregarClientes() {
    try {
      setErroClientes("");

      const resposta = await fetch(API_CLIENTES);

      if (!resposta.ok) {
        throw new Error(
          `Erro HTTP ${resposta.status} ao buscar clientes.`
        );
      }

      const dados = await resposta.json();

      console.log("Clientes recebidos da API:", dados);

      if (Array.isArray(dados)) {
        setClientes(dados);
      } else {
        setClientes([]);
        setErroClientes("A API não retornou uma lista de clientes.");
      }
    } catch (erro) {
      console.error("Erro ao carregar clientes:", erro);

      setClientes([]);
      setErroClientes(
        "Não foi possível carregar os clientes. Verifique se o servidor está funcionando."
      );
    }
  }

  async function excluirCliente(idUsuario) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este cliente?"
    );

    if (!confirmar) return;

    try {
      const resposta = await fetch(
        `${API_CLIENTES}/${idUsuario}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
            "Erro ao excluir cliente."
        );
        return;
      }

      alert("Cliente excluído com sucesso!");

      setClienteSelecionado(null);

      await carregarClientes();
    } catch (erro) {
      console.error("Erro ao excluir cliente:", erro);
      alert("Erro de conexão com o servidor.");
    }
  }

  /* =========================================================
     QUARTOS
  ========================================================= */

  async function carregarQuartos() {
    try {
      const resposta = await fetch(API_QUARTOS);

      if (!resposta.ok) {
        throw new Error("Erro ao buscar quartos.");
      }

      const dados = await resposta.json();

      setQuartos(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      console.error("Erro ao carregar quartos:", erro);
    }
  }

  /* =========================================================
     NOVO QUARTO
  ========================================================= */

  function abrirNovoQuarto() {
    setQuartoEditando(null);

    setFormQuarto({
      numero: "",
      tipo: "Solteiro",
      preco_diaria: "",
      disponivel: 1,
    });

    setMostrarFormQuarto(true);
  }

  /* =========================================================
     EDITAR QUARTO
  ========================================================= */

  function abrirEditarQuarto(quarto) {
    setQuartoEditando(quarto);

    setFormQuarto({
      numero: quarto.numero,
      tipo: quarto.tipo,
      preco_diaria: quarto.preco_diaria,
      disponivel: Number(quarto.disponivel),
    });

    setMostrarFormQuarto(true);
  }

  /* =========================================================
     FECHAR FORMULÁRIO
  ========================================================= */

  function fecharFormQuarto() {
    setMostrarFormQuarto(false);
    setQuartoEditando(null);

    setFormQuarto({
      numero: "",
      tipo: "Solteiro",
      preco_diaria: "",
      disponivel: 1,
    });
  }

  /* =========================================================
     ALTERAR FORMULÁRIO
  ========================================================= */

  function alterarFormQuarto(evento) {
    const { name, value } = evento.target;

    setFormQuarto((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  /* =========================================================
     SALVAR / CRIAR QUARTO
  ========================================================= */

  async function salvarQuarto(evento) {
    evento.preventDefault();

    const numero = String(formQuarto.numero).trim();
    const preco = Number(formQuarto.preco_diaria);

    if (!numero) {
      alert("Informe o número do quarto.");
      return;
    }

    if (!formQuarto.tipo) {
      alert("Selecione o tipo do quarto.");
      return;
    }

    if (!formQuarto.preco_diaria || preco < 0) {
      alert("Informe uma diária válida.");
      return;
    }

    try {
      const metodo = quartoEditando ? "PUT" : "POST";

      const url = quartoEditando
        ? `${API_QUARTOS}/${quartoEditando.id}`
        : API_QUARTOS;

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero,
          tipo: formQuarto.tipo,
          preco_diaria: preco,
          disponivel: Number(formQuarto.disponivel),
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
            "Erro ao salvar quarto."
        );
        return;
      }

      alert(
        quartoEditando
          ? "Quarto atualizado com sucesso!"
          : "Quarto criado com sucesso!"
      );

      fecharFormQuarto();

      await carregarQuartos();
    } catch (erro) {
      console.error("Erro ao salvar quarto:", erro);
      alert("Erro de conexão com o servidor.");
    }
  }

  /* =========================================================
     OCUPAR / LIBERAR QUARTO
  ========================================================= */

  async function alternarDisponibilidade(quarto) {
    try {
      const novaDisponibilidade =
        Number(quarto.disponivel) === 1 ? 0 : 1;

      const resposta = await fetch(
        `${API_QUARTOS}/${quarto.id}/disponibilidade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disponivel: novaDisponibilidade,
          }),
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
            "Erro ao alterar disponibilidade."
        );
        return;
      }

      await carregarQuartos();
    } catch (erro) {
      console.error(
        "Erro ao alterar disponibilidade:",
        erro
      );

      alert("Erro de conexão com o servidor.");
    }
  }

  /* =========================================================
     EXCLUIR QUARTO
  ========================================================= */

  async function excluirQuarto(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este quarto?"
    );

    if (!confirmar) return;

    try {
      const resposta = await fetch(
        `${API_QUARTOS}/${id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
            "Erro ao excluir quarto."
        );
        return;
      }

      alert("Quarto excluído com sucesso!");

      await carregarQuartos();
    } catch (erro) {
      console.error(
        "Erro ao excluir quarto:",
        erro
      );

      alert("Erro de conexão com o servidor.");
    }
  }

  /* =========================================================
     BUSCA DE CLIENTES
  ========================================================= */

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busca.toLowerCase().trim();

    return (
      String(cliente.nome || "")
        .toLowerCase()
        .includes(texto) ||
      String(cliente.email || "")
        .toLowerCase()
        .includes(texto) ||
      String(cliente.cep || "")
        .toLowerCase()
        .includes(texto)
    );
  });

  /* =========================================================
     ESTATÍSTICAS
  ========================================================= */

  const totalQuartos = quartos.length;

  const quartosDisponiveis = quartos.filter(
    (quarto) =>
      Number(quarto.disponivel) === 1
  ).length;

  const quartosOcupados = quartos.filter(
    (quarto) =>
      Number(quarto.disponivel) === 0
  ).length;

  if (!usuario) {
    return null;
  }

  return (
    <div className="dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-icone">
            SP
          </div>

          <div>
            <strong>
              Senac Plaza
            </strong>

            <span>
              HOTEL
            </span>
          </div>

        </div>


        <div className="sidebar-menu">

          <span className="menu-titulo">
            MENU PRINCIPAL
          </span>


          <Link
            to="/"
            className="menu-item ativo"
          >
            <span className="menu-icone">
              ▦
            </span>

            Dashboard
          </Link>


          <Link
            to="/cadastro"
            className="menu-item"
          >
            <span className="menu-icone">
              ＋
            </span>

            Novo cadastro
          </Link>

        </div>


        <div className="sidebar-footer">

          <div className="sidebar-status">

            <span className="status-ponto"></span>

            <div>
              <strong>
                Sistema online
              </strong>

              <small>
                API conectada
              </small>
            </div>

          </div>


          <button
            type="button"
            className="sidebar-sair"
            onClick={sair}
          >
            <span>
              ↪
            </span>

            Sair
          </button>

        </div>

      </aside>


      {/* =====================================================
          ÁREA PRINCIPAL
      ===================================================== */}

      <div className="dashboard-conteudo">

        <header className="dashboard-topo">

          <div>

            <span className="dashboard-breadcrumb">
              Senac Plaza Hotel / Dashboard
            </span>

            <h1>
              Visão geral
            </h1>

            <p>
              Gerencie clientes, quartos e
              disponibilidade do hotel.
            </p>

          </div>


          <div className="topo-acoes">

            <button
              type="button"
              className="topo-novo"
              onClick={abrirNovoQuarto}
            >
              <span>
                ＋
              </span>

              Novo quarto
            </button>


            <div className="usuario-avatar">
              {String(usuario)
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>


        <main className="dashboard-main">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="dashboard-hero">

            <div className="hero-conteudo">

              <span className="hero-tag">
                SENAC PLAZA HOTEL
              </span>


              <h2>
                Bem-vindo ao seu
                <br />
                painel de controle.
              </h2>


              <p>
                Acompanhe o funcionamento do hotel
                e gerencie seus dados em um só lugar.
              </p>

            </div>


            <div className="hero-decoracao">

              <div className="hero-circulo hero-circulo-1"></div>

              <div className="hero-circulo hero-circulo-2"></div>

              <span className="hero-simbolo">
                ✦
              </span>

            </div>

          </section>


          {/* =================================================
              ESTATÍSTICAS
          ================================================= */}

          <section className="dashboard-estatisticas">

            {/* CLIENTES */}

            <div className="dashboard-stat">

              <div className="stat-topo">

                <span className="stat-icone clientes">
                  👥
                </span>

                <span className="stat-label">
                  CLIENTES
                </span>

              </div>


              <strong>
                {clientes.length}
              </strong>


              <span className="stat-descricao">
                Clientes cadastrados
              </span>

            </div>


            {/* QUARTOS */}

            <div className="dashboard-stat">

              <div className="stat-topo">

                <span className="stat-icone quartos">
                  🏨
                </span>

                <span className="stat-label">
                  QUARTOS
                </span>

              </div>


              <strong>
                {totalQuartos}
              </strong>


              <span className="stat-descricao">
                Total de quartos
              </span>

            </div>


            {/* DISPONÍVEIS */}

            <div className="dashboard-stat">

              <div className="stat-topo">

                <span className="stat-icone disponivel">
                  ✓
                </span>

                <span className="stat-label">
                  DISPONÍVEIS
                </span>

              </div>


              <strong>
                {quartosDisponiveis}
              </strong>


              <span className="stat-descricao">
                Prontos para receber
              </span>

            </div>


            {/* OCUPADOS */}

            <div className="dashboard-stat">

              <div className="stat-topo">

                <span className="stat-icone ocupado">
                  ●
                </span>

                <span className="stat-label">
                  OCUPADOS
                </span>

              </div>


              <strong>
                {quartosOcupados}
              </strong>


              <span className="stat-descricao">
                Quartos em uso
              </span>

            </div>

          </section>


          {/* =================================================
              QUARTOS
          ================================================= */}

          <section className="dashboard-secao">

            <div className="dashboard-secao-topo">

              <div>

                <span className="secao-overline">
                  HOSPEDAGEM
                </span>

                <h2>
                  Quartos do hotel
                </h2>

                <p>
                  Controle de quartos e disponibilidade.
                </p>

              </div>


              <button
                type="button"
                className="botao-principal dashboard-botao"
                onClick={abrirNovoQuarto}
              >
                <span>
                  ＋
                </span>

                Novo quarto
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

                    <div className="quarto-card-top">

                      <div className="quarto-numero">

                        <span>
                          QUARTO
                        </span>

                        <strong>
                          {quarto.numero}
                        </strong>

                      </div>


                      <span
                        className={
                          Number(quarto.disponivel) === 1
                            ? "status disponivel"
                            : "status ocupado"
                        }
                      >
                        {Number(quarto.disponivel) === 1
                          ? "Disponível"
                          : "Ocupado"}
                      </span>

                    </div>


                    <div className="quarto-info">

                      <div>

                        <span>
                          TIPO
                        </span>

                        <strong>
                          {quarto.tipo}
                        </strong>

                      </div>


                      <div>

                        <span>
                          DIÁRIA
                        </span>

                        <strong>
                          {Number(
                            quarto.preco_diaria
                          ).toLocaleString(
                            "pt-BR",
                            {
                              style: "currency",
                              currency: "BRL",
                            }
                          )}
                        </strong>

                      </div>

                    </div>


                    <div className="quarto-acoes">

                      <button
                        type="button"
                        className="botao-editar"
                        onClick={() =>
                          abrirEditarQuarto(quarto)
                        }
                      >
                        ✎ Editar
                      </button>


                      <button
                        type="button"
                        className="botao-status"
                        onClick={() =>
                          alternarDisponibilidade(
                            quarto
                          )
                        }
                      >
                        {Number(quarto.disponivel) === 1
                          ? "● Ocupar"
                          : "✓ Liberar"}
                      </button>


                      <button
                        type="button"
                        className="botao-excluir"
                        onClick={() =>
                          excluirQuarto(
                            quarto.id
                          )
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


          {/* =================================================
              CLIENTES
          ================================================= */}

          <section className="dashboard-secao">

            <div className="dashboard-secao-topo clientes-topo">

              <div>

                <span className="secao-overline">
                  CLIENTES
                </span>

                <h2>
                  Clientes cadastrados
                </h2>

                <p>
                  Consulte e gerencie os clientes registrados.
                </p>

              </div>


              <div className="busca-container">

                <span className="busca-icone">
                  ⌕
                </span>


                <input
                  className="campo-busca"
                  type="text"
                  placeholder="Buscar por nome, e-mail ou CEP..."
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                />

              </div>

            </div>


            {erroClientes ? (

              <div className="vazio">
                {erroClientes}
              </div>

            ) : clientesFiltrados.length === 0 ? (

              <div className="vazio">

                {busca
                  ? "Nenhum cliente encontrado."
                  : "Nenhum cliente cadastrado."}

              </div>

            ) : (

              <div className="clientes-grid">

                {clientesFiltrados.map((cliente) => (

                  <article
                    className="cliente-card"
                    key={cliente.id_usuario}
                  >

                    <div className="cliente-card-top">

                      <div className="cliente-avatar">

                        {String(
                          cliente.nome || "C"
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>


                      <div className="cliente-identidade">

                        <span>
                          CLIENTE #{cliente.id_usuario}
                        </span>

                        <h3>
                          {cliente.nome || "-"}
                        </h3>

                      </div>

                    </div>


                    <div className="cliente-dados">

                      <div>

                        <span>
                          E-MAIL
                        </span>

                        <strong>
                          {cliente.email || "-"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          ENDEREÇO
                        </span>

                        <strong>
                          {cliente.rua || "-"},{" "}
                          {cliente.numero || "-"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          LOCALIDADE
                        </span>

                        <strong>
                          {cliente.cidade || "-"}{" "}
                          -{" "}
                          {cliente.uf || "-"}
                        </strong>

                      </div>

                    </div>


                    <div className="cliente-acoes">

                      <button
                        type="button"
                        className="botao-detalhes"
                        onClick={() =>
                          setClienteSelecionado(
                            cliente
                          )
                        }
                      >
                        Ver detalhes
                      </button>


                      <button
                        type="button"
                        className="botao-excluir"
                        onClick={() =>
                          excluirCliente(
                            cliente.id_usuario
                          )
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

        </main>

      </div>


      {/* =====================================================
          MODAL — NOVO / EDITAR QUARTO
      ===================================================== */}

      {mostrarFormQuarto && (

        <div
          className="modal-fundo"
          onClick={fecharFormQuarto}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-cabecalho">

              <div>

                <span className="modal-overline">
                  HOSPEDAGEM
                </span>

                <h2>
                  {quartoEditando
                    ? "Editar quarto"
                    : "Novo quarto"}
                </h2>

                <p>
                  Preencha os dados do quarto.
                </p>

              </div>


              <button
                type="button"
                className="modal-fechar"
                onClick={fecharFormQuarto}
              >
                ×
              </button>

            </div>


            <form onSubmit={salvarQuarto}>

              {/* NÚMERO */}

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


              {/* TIPO */}

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


              {/* DIÁRIA */}

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


              {/* DISPONIBILIDADE */}

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


              {/* BOTÕES */}

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


      {/* =====================================================
          MODAL — CLIENTE
      ===================================================== */}

      {clienteSelecionado && (

        <div
          className="modal-fundo"
          onClick={() =>
            setClienteSelecionado(null)
          }
        >

          <div
            className="modal modal-cliente"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-cabecalho">

              <div className="modal-cliente-titulo">

                <div className="cliente-avatar modal-avatar">

                  {String(
                    clienteSelecionado.nome || "C"
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>


                <div>

                  <span className="modal-overline">
                    CLIENTE #{clienteSelecionado.id_usuario}
                  </span>

                  <h2>
                    {clienteSelecionado.nome || "-"}
                  </h2>

                  <p>
                    Informações completas do cliente.
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="modal-fechar"
                onClick={() =>
                  setClienteSelecionado(null)
                }
              >
                ×
              </button>

            </div>


            <div className="detalhes">

              <div className="detalhe-item">

                <span>
                  NOME COMPLETO
                </span>

                <strong>
                  {clienteSelecionado.nome || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  E-MAIL
                </span>

                <strong>
                  {clienteSelecionado.email || "-"}
                </strong>

              </div>


              <div className="detalhe-item detalhe-largo">

                <span>
                  ENDEREÇO
                </span>

                <strong>
                  {clienteSelecionado.rua || "-"},{" "}
                  {clienteSelecionado.numero || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  COMPLEMENTO
                </span>

                <strong>
                  {clienteSelecionado.complemento || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  BAIRRO
                </span>

                <strong>
                  {clienteSelecionado.bairro || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  CIDADE
                </span>

                <strong>
                  {clienteSelecionado.cidade || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  ESTADO
                </span>

                <strong>
                  {clienteSelecionado.estado || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  UF
                </span>

                <strong>
                  {clienteSelecionado.uf || "-"}
                </strong>

              </div>


              <div className="detalhe-item">

                <span>
                  CEP
                </span>

                <strong>
                  {clienteSelecionado.cep || "-"}
                </strong>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Accueil;

