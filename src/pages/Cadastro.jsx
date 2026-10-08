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
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [googleConectado, setGoogleConectado] = useState(false);

  useEffect(() => {
    const usuarioGoogle = localStorage.getItem("usuarioGoogle");

    if (!usuarioGoogle) {
      return;
    }

    try {
      const dadosGoogle = JSON.parse(usuarioGoogle);

      setForm((anterior) => ({
        ...anterior,
        nome: dadosGoogle.nome || anterior.nome,
        email: dadosGoogle.email || anterior.email
      }));

      setGoogleConectado(true);
    } catch (erro) {
      console.error("Erro ao ler dados do Google:", erro);
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
    const cepLimpo = form.cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      alert("Digite um CEP válido com 8 números.");
      return;
    }

    try {
      setCarregandoCep(true);

      const resposta = await fetch(
        `${API_CEP}/${cepLimpo}`
      );

      const dados = await resposta.json();

      if (!resposta.ok || dados.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setForm((anterior) => ({
        ...anterior,

        cep: dados.cep || anterior.cep,

        logradouro:
          dados.logradouro || anterior.logradouro,

        rua:
          dados.logradouro || anterior.rua,

        bairro:
          dados.bairro || anterior.bairro,

        localidade:
          dados.localidade || anterior.localidade,

        cidade:
          dados.localidade || anterior.cidade,

        uf:
          dados.uf || anterior.uf,

        estado:
          dados.estado || anterior.estado,

        regiao:
          dados.regiao || anterior.regiao
      }));

    } catch (erro) {
      console.error(erro);

      alert("Erro ao consultar o CEP.");

    } finally {
      setCarregandoCep(false);
    }
  }

  function formatarCep(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);

    if (numeros.length > 5) {
      return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
    }

    return numeros;
  }

  function formatarCpf(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length > 9) {
      return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
    }

    if (numeros.length > 6) {
      return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    }

    if (numeros.length > 3) {
      return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    }

    return numeros;
  }

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length > 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    if (numeros.length > 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }

    if (numeros.length > 2) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return numeros;
  }

  async function salvarCadastro(evento) {
    evento.preventDefault();

    const camposObrigatorios = [
      ["nome", "Nome"],
      ["data_nascimento", "Data de nascimento"],
      ["email", "E-mail"],
      ["senha", "Senha"],
      ["cep", "CEP"],
      ["logradouro", "Logradouro"],
      ["numero", "Número"],
      ["bairro", "Bairro"],
      ["localidade", "Cidade"],
      ["uf", "UF"],
      ["estado", "Estado"],
      ["regiao", "Região"]
    ];

    for (const [campo, nomeCampo] of camposObrigatorios) {
      if (!String(form[campo] || "").trim()) {
        alert(
          `Preencha o campo obrigatório: ${nomeCampo}.`
        );
        return;
      }
    }

    if (form.senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
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
              form.cpf.replace(/\D/g, ""),

            telefone:
              form.telefone.replace(/\D/g, ""),

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

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(
          dados.mensagem ||
          "Erro ao cadastrar cliente."
        );
        return;
      }

      localStorage.removeItem("usuarioGoogle");

      localStorage.setItem(
        "usuario",
        JSON.stringify({
          id: dados.id_usuario,
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
    <div className="cadastro-page">

      <header className="cadastro-header">

        <Link
          to="/"
          className="cadastro-brand"
        >
          <span className="cadastro-brand-icon">
            SP
          </span>

          <span className="cadastro-brand-text">
            <strong>Senac Plaza</strong>
            <small>HOTEL</small>
          </span>
        </Link>

        <nav className="cadastro-nav">
          <Link to="/">
            Dashboard
          </Link>

          <Link
            to="/cadastro"
            className="ativo"
          >
            Novo cadastro
          </Link>

          <Link to="/login">
            Sair
          </Link>
        </nav>

      </header>

      <main className="cadastro-main">

        <div className="cadastro-breadcrumb">
          <Link to="/">
            Senac Plaza Hotel
          </Link>

          <span>/</span>

          <strong>Novo cadastro</strong>
        </div>

        <section className="cadastro-title">

          <div>
            <span className="cadastro-overline">
              CADASTRO DE CLIENTE
            </span>

            <h1>
              Novo cadastro
            </h1>

            <p>
              Cadastre um novo cliente no
              sistema do hotel.
            </p>
          </div>

          <div className="cadastro-number">
            02
          </div>

        </section>

        {googleConectado && (
          <div className="cadastro-google-alert">

            <div className="cadastro-google-icon">
              ✓
            </div>

            <div>
              <strong>
                Conta Google conectada
              </strong>

              <p>
                Seus dados básicos foram
                preenchidos. Complete o cadastro
                e escolha uma senha.
              </p>
            </div>

          </div>
        )}

        <form
          className="cadastro-card"
          onSubmit={salvarCadastro}
        >

          <div className="cadastro-section-header">

            <div className="cadastro-section-icon">
              👤
            </div>

            <div>
              <h2>
                Dados pessoais
              </h2>

              <p>
                Informe os dados do cliente.
              </p>
            </div>

          </div>

          <div className="cadastro-grid">

            <label className="cadastro-field cadastro-field-full">
              <span>
                Nome completo
                <b>*</b>
              </span>

              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={alterarCampo}
                placeholder="Digite o nome completo"
                autoComplete="name"
              />
            </label>

            <label className="cadastro-field">
              <span>
                Data de nascimento
                <b>*</b>
              </span>

              <input
                type="date"
                name="data_nascimento"
                value={form.data_nascimento}
                onChange={alterarCampo}
              />
            </label>

            <label className="cadastro-field">
              <span>
                CPF
              </span>

              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    cpf: formatarCpf(e.target.value)
                  }))
                }
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </label>

            <label className="cadastro-field">
              <span>
                E-mail
                <b>*</b>
              </span>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={alterarCampo}
                placeholder="cliente@email.com"
                autoComplete="email"
              />
            </label>

            <label className="cadastro-field">
              <span>
                Telefone
              </span>

              <input
                type="text"
                name="telefone"
                value={form.telefone}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    telefone:
                      formatarTelefone(
                        e.target.value
                      )
                  }))
                }
                placeholder="(11) 99999-9999"
                inputMode="tel"
              />
            </label>

            <label className="cadastro-field">
              <span>
                Senha
                <b>*</b>
              </span>

              <div className="cadastro-password">
                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  name="senha"
                  value={form.senha}
                  onChange={alterarCampo}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                >
                  {mostrarSenha
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>

              {googleConectado && (
                <small className="cadastro-helper">
                  A senha também permitirá acesso
                  pelo login tradicional.
                </small>
              )}
            </label>

          </div>

          <div className="cadastro-divider"></div>

          <div className="cadastro-section-header">

            <div className="cadastro-section-icon">
              ⌖
            </div>

            <div>
              <h2>
                Endereço
              </h2>

              <p>
                Informe o endereço de residência.
              </p>
            </div>

          </div>

          <div className="cadastro-grid">

            <div className="cadastro-field cadastro-cep-field">

              <label>
                <span>
                  CEP
                  <b>*</b>
                </span>

                <div className="cadastro-cep-row">

                  <input
                    type="text"
                    name="cep"
                    value={form.cep}
                    onChange={(e) =>
                      setForm((anterior) => ({
                        ...anterior,
                        cep: formatarCep(
                          e.target.value
                        )
                      }))
                    }
                    placeholder="00000-000"
                    inputMode="numeric"
                  />

                  <button
                    type="button"
                    className="cadastro-cep-button"
                    onClick={buscarCep}
                    disabled={carregandoCep}
                  >
                    {carregandoCep ? (
                      <>
                        <span className="cadastro-spinner"></span>
                        Buscando...
                      </>
                    ) : (
                      "Buscar CEP"
                    )}
                  </button>

                </div>

              </label>

            </div>

            <label className="cadastro-field cadastro-field-wide">
              <span>
                Logradouro
                <b>*</b>
              </span>

              <input
                type="text"
                name="logradouro"
                value={form.logradouro}
                onChange={alterarCampo}
                placeholder="Rua, avenida, praça..."
              />
            </label>

            <label className="cadastro-field">
              <span>
                Número
                <b>*</b>
              </span>

              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={alterarCampo}
                placeholder="Nº"
              />
            </label>

            <label className="cadastro-field">
              <span>
                Complemento
              </span>

              <input
                type="text"
                name="complemento"
                value={form.complemento}
                onChange={alterarCampo}
                placeholder="Apartamento, bloco..."
              />
            </label>

            <label className="cadastro-field">
              <span>
                Bairro
                <b>*</b>
              </span>

              <input
                type="text"
                name="bairro"
                value={form.bairro}
                onChange={alterarCampo}
                placeholder="Digite o bairro"
              />
            </label>

            <label className="cadastro-field">
              <span>
                Cidade
                <b>*</b>
              </span>

              <input
                type="text"
                name="localidade"
                value={form.localidade}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    localidade: e.target.value,
                    cidade: e.target.value
                  }))
                }
                placeholder="Digite a cidade"
              />
            </label>

            <label className="cadastro-field">
              <span>
                UF
                <b>*</b>
              </span>

              <input
                type="text"
                name="uf"
                value={form.uf}
                onChange={alterarCampo}
                placeholder="SP"
                maxLength={2}
              />
            </label>

            <label className="cadastro-field">
              <span>
                Estado
                <b>*</b>
              </span>

              <input
                type="text"
                name="estado"
                value={form.estado}
                onChange={alterarCampo}
                placeholder="São Paulo"
              />
            </label>

            <label className="cadastro-field">
              <span>
                Região
                <b>*</b>
              </span>

              <input
                type="text"
                name="regiao"
                value={form.regiao}
                onChange={alterarCampo}
                placeholder="Sudeste"
              />
            </label>

          </div>

          <div className="cadastro-required">
            <b>*</b>
            Campos obrigatórios
          </div>

          <div className="cadastro-actions">

            <Link
              to="/"
              className="cadastro-cancel"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="cadastro-save"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <span className="cadastro-spinner"></span>
                  Salvando...
                </>
              ) : (
                <>
                  Salvar cadastro
                  <span>→</span>
                </>
              )}
            </button>

          </div>

        </form>

      </main>

      <footer className="cadastro-footer">
        © 2026 Senac Plaza Hotel · Sistema de Gestão
      </footer>

    </div>
  );
}

export default Cadastro;