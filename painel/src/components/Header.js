import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>📞 Painel de Atendimento</h1>
          <span className="subtitle">Sistema de Fila</span>
        </div>
        <div className="header-right">
          <div className="status-badge">
            <span className="status-dot"></span>
            Conectado
          </div>
        </div>
      </div>
    </header>
  );
}
