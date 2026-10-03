import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_CLIENTES = "http://localhost:3001/cadastros";
const API_CEP = "http://localhost:3001/cep";

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
  const [salvando, setSalvando] = useState(false);
  const [googleConectado, setGoogleConectado] = useState(false);

  useEffect(() => {
    const usuarioGoogle =
      localStorage.getItem("usuarioGoogle");

    if (!usuarioGoogle) {
      return;
    }

    try {
      const dadosGoogle =
        JSON.parse(usuarioGoogle);

      setForm((anterior) => ({
        ...anterior,
        nome:
          dadosGoogle.nome ||
          anterior.nome,
        email:
          dadosGoogle.email ||
          anterior.email
      }));

      setGoogleConectado(true);

    } catch (erro) {
      console.error(
        "Erro ao ler dados do Google:",
        erro
      );
    }
  }, []);

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

    const camposObrigatorios = [
      ["nome", "Nome"],
      ["data_nascimento", "Data de nascimento"],
      ["email", "E-mail"],
      ["senha", "Senha"],
      ["cep", "CEP"],
      ["numero", "Número"]
    ];

    for (const [campo, nomeCampo] of camposObrigatorios) {
      if (!String(form[campo] || "").trim()) {
        alert(
          `Preencha o campo obrigatório: ${nomeCampo}.`
        );
        return;
      }
    }

    try {
      setSalvando(true);

      const resposta = await fetch(
        API_CLIENTES,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            nome: form.nome.trim(),

            data_nascimento:
              form.data_nascimento,

            email:
              form.email.trim(),

            senha:
              form.senha,

            cpf:
              form.cpf.trim(),

            telefone:
              form.telefone.trim(),

            cep:
              form.cep.trim(),

            logradouro:
              form.logradouro.trim(),

            rua:
              form.rua.trim() ||
              form.logradouro.trim(),

            numero:
              form.numero.trim(),

            complemento:
              form.complemento.trim(),

            bairro:
              form.bairro.trim(),

            localidade:
              form.localidade.trim() ||
              form.cidade.trim(),

            cidade:
              form.cidade.trim() ||
              form.localidade.trim(),

            uf:
              form.uf.trim(),

            estado:
              form.estado.trim(),

            regiao:
              form.regiao.trim()
          })
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

      localStorage.removeItem(
        "usuarioGoogle"
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify({
          id: dados.usuario?.id,
          nome: form.nome,
          email: form.email
        })
      );

      if (googleConectado) {
        alert(
          "Cadastro concluído com sucesso! Sua conta Google foi vinculada ao cadastro."
        );
      } else {
        alert(
          "Cliente cadastrado com sucesso!"
        );
      }

      navigate("/");

    } catch (erro) {
      console.error(erro);

      alert(
        "Erro de conexão com o servidor."
      );

    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <header className="topo">
        <div className="logo-area">
          <h1>Hotel</h1>
          <p>Sistema de Cadastro</p>
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
              <h2>Novo cadastro</h2>

              <p>
                Cadastre um novo cliente no hotel
              </p>
            </div>
          </div>

          {googleConectado && (
            <div
              className="google-sucesso"
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "8px"
              }}
            >
              ✓ Google conectado.
              Complete os dados abaixo
              e escolha uma senha.
            </div>
          )}

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
              />
            </label>

            <label>
              Data de nascimento

              <input
                type="date"
                name="data_nascimento"
                value={form.data_nascimento}
                onChange={alterarCampo}
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Senha

              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={alterarCampo}
                placeholder="Escolha uma senha"
              />
            </label>

            {googleConectado && (
              <p
                style={{
                  marginTop: "-10px",
                  fontSize: "14px"
                }}
              >
                A conta Google foi verificada.
                Agora escolha uma senha para
                acessar o sistema também pelo
                login tradicional.
              </p>
            )}

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
                />
              </label>

              <button
                type="button"
                className="botao-principal"
                onClick={buscarCep}
                disabled={carregandoCep}
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
                value={form.logradouro}
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
              />
            </label>

            <label>
              Complemento

              <input
                type="text"
                name="complemento"
                value={form.complemento}
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
                value={form.localidade}
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

            <label>
              Estado

              <input
                type="text"
                name="estado"
                value={form.estado}
                onChange={alterarCampo}
              />
            </label>

            <label>
              Região

              <input
                type="text"
                name="regiao"
                value={form.regiao}
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
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar cadastro"}
              </button>

            </div>

          </form>
        </section>
      </main>
    </>
  );
}

export default Cadastro;