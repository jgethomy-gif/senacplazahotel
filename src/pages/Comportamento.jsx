import { Link } from "react-router-dom";

function Comportamento() {
  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Hotel</h1>
          <p>Sistema de Cadastro</p>
        </div>

        <nav>
          <Link to="/">Início</Link>
          <Link to="/cadastro">Novo cadastro</Link>
          <Link to="/comportamento">Comportamento</Link>
        </nav>
      </header>

      <main className="content">
        <section className="hero">
          <span className="eyebrow">03</span>
          <h2>Comportamento</h2>
          <p>
            Informações sobre o comportamento e as regras de utilização
            do sistema do hotel.
          </p>
        </section>

        <section className="cards-grid">
          <div className="card">
            <h3>Clientes</h3>
            <p>
              Os dados dos clientes devem ser preenchidos corretamente
              para manter o cadastro organizado.
            </p>
          </div>

          <div className="card">
            <h3>Quartos</h3>
            <p>
              Os quartos podem ser cadastrados, editados, ocupados,
              liberados e excluídos pelo sistema.
            </p>
          </div>

          <div className="card">
            <h3>Reservas</h3>
            <p>
              As reservas devem utilizar um cliente e um quarto
              cadastrados no sistema.
            </p>
          </div>

          <div className="card">
            <h3>Disponibilidade</h3>
            <p>
              Um quarto disponível pode ser ocupado e posteriormente
              liberado quando estiver disponível novamente.
            </p>
          </div>
        </section>

        <Link className="button" to="/">
          Voltar para Início
        </Link>
      </main>
    </div>
  );
}

export default Comportamento;