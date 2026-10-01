
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_LOGIN = "http://localhost:3001/login";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  async function entrar(e) {
    e.preventDefault();

    if (!email || !senha) {
      setMensagem("Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");

      const resposta = await fetch(API_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          senha: senha
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.mensagem || "E-mail ou senha incorretos.");
        return;
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify(dados.usuario)
      );

      setMensagem(dados.mensagem);

      setTimeout(() => {
        navigate("/");
      }, 500);

    } catch (error) {
      console.error(error);
      setMensagem("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Hotel</h1>
          <p>Sistema de Cadastro</p>
        </div>

        <nav>
          <Link to="/">Início</Link>
          <Link to="/login">Login</Link>
          <Link to="/cadastro">Novo cadastro</Link>
        </nav>
      </header>

      <main className="content">
        <section className="hero">
          <span className="eyebrow">01</span>

          <h2>Login</h2>

          <p>
            Entre no sistema utilizando seu e-mail e senha.
          </p>
        </section>

        <form className="form-card" onSubmit={entrar}>
          <label>
            E-mail

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
            />
          </label>

          <label>
            Senha

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
            />
          </label>

          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          {mensagem && (
            <p className="form-message">
              {mensagem}
            </p>
          )}

          <p>
            Ainda não possui cadastro?{" "}
            <Link to="/cadastro">
              Criar cadastro
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default Login;

