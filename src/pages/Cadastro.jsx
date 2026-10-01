
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_CLIENTES = "http://localhost:3001/cadastros";
const API_CEP = "http://localhost:3001/cep";

const GOOGLE_CLIENT_ID =
  "124183329443-7e6lu1jrdlqhkm15ofjstfi9j9emhnuq.apps.googleusercontent.com";

function Cadastro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    data_nascimento: "",
    email: "",
    senha: "",
    cpf: "",
    telefone: "",
    cep: "",
    logradouro: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    localidade: "",
    cidade: "",
    uf: "",
    estado: "",
    regiao: ""
  });

  const [carregandoCep, setCarregandoCep] = useState(false);
  const [googleCarregando, setGoogleCarregando] = useState(false);
  const [googleConectado, setGoogleConectado] = useState(false);

  useEffect(() => {
    function configurarGoogle() {
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        console.error(
          "Google Identity Services não foi carregado."
        );
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: receberGoogle
      });

      const container =
        document.getElementById("google-button");

      if (!container) {
        return;
      }

      container.innerHTML = "";

      window.google.accounts.id.renderButton(
        container,
        {
          theme: "outline",
          size: "large",
          width: 400,
          text: "continue_with",
          shape: "rectangular"
        }
      );
    }

    function carregarGoogle() {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        configurarGoogle();
        return;
      }

      const scriptExistente =
        document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );

      if (scriptExistente) {
        scriptExistente.addEventListener(
          "load",
          configurarGoogle
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://accounts.google.com/gsi/client";

      script.async = true;
      script.defer = true;

      script.onload = configurarGoogle;

      script.onerror = () => {
        console.error(
          "Não foi possível carregar o Google."
        );
      };

      document.body.appendChild(script);
    }

    carregarGoogle();

    return () => {
      const script =
        document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );

      if (script) {
        script.removeEventListener(
          "load",
          configurarGoogle
        );
      }
    };
  }, []);

  async function receberGoogle(response) {
    try {
      setGoogleCarregando(true);

      if (!response || !response.credential) {
        alert(
          "Não foi possível obter os dados do Google."
        );
        return;
      }

      const resposta = await fetch(
        "http://localhost:3001/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            credential: response.credential
          })
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
          "Não foi possível entrar com o Google."
        );
        return;
      }

      if (dados.novoCadastro === false) {
        alert(
          "Login com Google realizado com sucesso!"
        );

        navigate("/");
        return;
      }

      if (dados.novoCadastro === true) {
        setForm((anterior) => ({
          ...anterior,
          nome:
            dados.usuario?.nome ||
            anterior.nome,
          email:
            dados.usuario?.email ||
            anterior.email
        }));

        setGoogleConectado(true);

        alert(
          "Google conectado! Complete os dados do cadastro e escolha uma senha."
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao conectar com Google:",
        erro
      );

      alert(
        "Erro de conexão com o servidor."
      );
    } finally {
      setGoogleCarregando(false);
    }
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  async function buscarCep() {
    const cepLimpo =
      form.cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      alert(
        "Digite um CEP válido com 8 números."
      );
      return;
    }

    try {
      setCarregandoCep(true);

      const resposta = await fetch(
        `${API_CEP}/${cepLimpo}`
      );

      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setForm((anterior) => ({
        ...anterior,

        cep:
          dados.cep ||
          anterior.cep,

        logradouro:
          dados.rua || "",

        rua:
          dados.rua || "",

        bairro:
          dados.bairro || "",

        localidade:
          dados.cidade || "",

        cidade:
          dados.cidade || "",

        uf:
          dados.uf || "",

        estado:
          dados.estado || "",

        regiao:
          dados.regiao || ""
      }));
    } catch (erro) {
      console.error(erro);

      alert(
        "Erro ao consultar o CEP."
      );
    } finally {
      setCarregandoCep(false);
    }
  }

  async function salvarCadastro(evento) {
    evento.preventDefault();

    try {
      const resposta = await fetch(
        API_CLIENTES,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(form)
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
          "Erro ao cadastrar cliente."
        );

        return;
      }

      alert(
        "Cliente cadastrado com sucesso!"
      );

      navigate("/");
    } catch (erro) {
      console.error(erro);

      alert(
        "Erro de conexão com o servidor."
      );
    }
  }

  return (
    <>
      <header className="topo">

        <div className="logo-area">

          <h1>
            Hotel
          </h1>

          <p>
            Sistema de Cadastro
          </p>

        </div>

        <nav>

          <Link to="/">
            Início
          </Link>

          <Link to="/cadastro">
            Novo cadastro
          </Link>

          <Link
            to="/"
            className="botao-sair"
          >
            Sair
          </Link>

        </nav>

      </header>

      <main className="conteudo">

        <section className="secao-cadastro">

          <div className="cabecalho-secao">

            <span className="numero-secao">
              02
            </span>

            <div>

              <h2>
                Novo cadastro
              </h2>

              <p>
                Cadastre um novo cliente no hotel
              </p>

            </div>

          </div>

          <form
            className="form-cadastro"
            onSubmit={salvarCadastro}
          >

            <label>
              Nome

              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={alterarCampo}
                required
              />

            </label>

            <label>
              Data de nascimento

              <input
                type="date"
                name="data_nascimento"
                value={
                  form.data_nascimento
                }
                onChange={alterarCampo}
                required
              />

            </label>

            <label>
              E-mail

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={alterarCampo}
                required
              />

            </label>

            <label>
              Senha

              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={alterarCampo}
                required
              />

            </label>

            {/* GOOGLE */}

            <div className="google-area">

              <div className="separador-google">

                <span>
                  ou
                </span>

              </div>

              <div
                id="google-button"
                className="google-button-container"
              ></div>

              {googleCarregando && (
                <p className="google-status">
                  Conectando com Google...
                </p>
              )}

              {googleConectado && (
                <p className="google-sucesso">
                  ✓ Google conectado. Complete os
                  dados abaixo.
                </p>
              )}

            </div>

            <label>
              CPF

              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={alterarCampo}
              />

            </label>

            <label>
              Telefone

              <input
                type="text"
                name="telefone"
                value={form.telefone}
                onChange={alterarCampo}
              />

            </label>

            <div className="campo-cep">

              <label>
                CEP

                <input
                  type="text"
                  name="cep"
                  value={form.cep}
                  onChange={alterarCampo}
                  placeholder="01311-000"
                  required
                />

              </label>

              <button
                type="button"
                className="botao-principal"
                onClick={buscarCep}
              >
                {carregandoCep
                  ? "Consultando..."
                  : "Buscar CEP"}
              </button>

            </div>

            <label>
              Logradouro

              <input
                type="text"
                name="logradouro"
                value={
                  form.logradouro
                }
                onChange={alterarCampo}
              />

            </label>

            <label>
              Número

              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={alterarCampo}
                required
              />

            </label>

            <label>
              Complemento

              <input
                type="text"
                name="complemento"
                value={
                  form.complemento
                }
                onChange={alterarCampo}
              />

            </label>

            <label>
              Bairro

              <input
                type="text"
                name="bairro"
                value={form.bairro}
                onChange={alterarCampo}
              />

            </label>

            <label>
              Cidade

              <input
                type="text"
                name="localidade"
                value={
                  form.localidade
                }
                onChange={alterarCampo}
              />

            </label>

            <label>
              UF

              <input
                type="text"
                name="uf"
                value={form.uf}
                onChange={alterarCampo}
              />

            </label>

            <div className="form-acoes">

              <Link
                to="/"
                className="botao-cancelar"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                className="botao-principal"
              >
                Salvar cadastro
              </button>

            </div>

          </form>

        </section>

      </main>
    </>
  );
}

export default Cadastro;

