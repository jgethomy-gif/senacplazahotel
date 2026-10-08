import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  async function entrar(e) {
    e.preventDefault();

    if (!email || !senha) {
      setTipoMensagem("erro");
      setMensagem("Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");
      setTipoMensagem("");

      const resposta = await api.post("/login", {
        email,
        senha,
      });

      const dados = resposta.data;

      localStorage.setItem(
        "usuario",
        JSON.stringify(dados.usuario)
      );

      setTipoMensagem("sucesso");
      setMensagem(
        dados.mensagem || "Login realizado com sucesso!"
      );

      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error(error);

      setTipoMensagem("erro");

      if (error.response) {
        setMensagem(
          error.response.data?.mensagem ||
            "E-mail ou senha incorretos."
        );
      } else {
        setMensagem(
          "Não foi possível conectar ao servidor."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle(credential) {
    try {
      setCarregando(true);
      setMensagem("");
      setTipoMensagem("");

      // Rota correta do backend
      const resposta = await api.post("/auth/google", {
        credential,
      });

      const dados = resposta.data;

      if (dados.usuario) {
        localStorage.setItem(
          "usuario",
          JSON.stringify(dados.usuario)
        );
      }

      setTipoMensagem("sucesso");
      setMensagem(
        dados.mensagem ||
          "Login com Google realizado com sucesso!"
      );

      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error(error);

      setTipoMensagem("erro");

      if (error.response) {
        setMensagem(
          error.response.data?.mensagem ||
            "Não foi possível entrar com Google."
        );
      } else {
        setMensagem(
          "Não foi possível conectar ao servidor."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">

      {/* Fundo decorativo */}
      <div className="login-decoration login-decoration-1"></div>
      <div className="login-decoration login-decoration-2"></div>

      {/* Cabeçalho */}
      <header className="login-header">
        <Link to="/" className="login-brand">
          <span className="login-brand-icon">SP</span>

          <span className="login-brand-text">
            <strong>Senac Plaza</strong>
            <small>HOTEL</small>
          </span>
        </Link>

        <Link
          to="/cadastro"
          className="login-header-link"
        >
          Novo cadastro
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="login-container">

        <section className="login-intro">
          <span className="login-overline">
            SENAC PLAZA HOTEL
          </span>

          <h1>
            Bem-vindo
            <br />
            de volta.
          </h1>

          <p>
            Acesse o sistema para gerenciar clientes,
            quartos e informações do hotel.
          </p>

          <div className="login-line"></div>

          <span className="login-security">
            🔒 Ambiente seguro
          </span>
        </section>

        {/* Card */}
        <section className="login-card">

          <div className="login-card-header">
            <div>
              <span className="login-card-overline">
                ACESSO
              </span>

              <h2>Entrar no sistema</h2>

              <p>
                Informe seus dados para continuar.
              </p>
            </div>

            <div className="login-card-symbol">
              SP
            </div>
          </div>

          <form onSubmit={entrar}>

            <label className="login-field">
              <span>E-mail</span>

              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  autoComplete="email"
                  disabled={carregando}
                />
              </div>
            </label>

            <label className="login-field">
              <span>Senha</span>

              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  🔒
                </span>

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={senha}
                  onChange={(e) =>
                    setSenha(e.target.value)
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={carregando}
                />

                <button
                  type="button"
                  className="login-show-password"
                  onClick={() =>
                    setMostrarSenha(!mostrarSenha)
                  }
                  tabIndex="-1"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="login-submit"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span className="login-spinner"></span>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          <div className="login-divider">
            <span></span>
            <strong>ou</strong>
            <span></span>
          </div>

          <div className="login-google">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  entrarComGoogle(
                    credentialResponse.credential
                  );
                } else {
                  setTipoMensagem("erro");
                  setMensagem(
                    "O Google não retornou o credential."
                  );
                }
              }}
              onError={() => {
                setTipoMensagem("erro");
                setMensagem(
                  "Não foi possível fazer login com Google."
                );
              }}
              useOneTap={false}
            />
          </div>

          {mensagem && (
            <div
              className={`login-message ${tipoMensagem}`}
            >
              <span>
                {tipoMensagem === "sucesso"
                  ? "✓"
                  : "!"}
              </span>

              <p>{mensagem}</p>
            </div>
          )}

          <div className="login-footer">
            <span>
              Ainda não possui cadastro?
            </span>

            <Link to="/cadastro">
              Criar cadastro
            </Link>
          </div>

        </section>
      </main>

      <footer className="login-page-footer">
        © 2026 Senac Plaza Hotel · Sistema de Gestão
      </footer>
    </div>
  );
}

export default Login;