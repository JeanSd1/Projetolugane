import "./Fila.css";

export default function Fila({ fila, chamadoAtual, onSelect }) {
  return (
    <div className="fila">
      <div className="fila-header">
        <h2>📋 Fila de Chamados</h2>
        <span className="fila-badge">{fila.length}</span>
      </div>

      <div className="fila-items">
        {fila.length === 0 ? (
          <div className="fila-vazia">
            <p>😴 Nenhum chamado na fila</p>
          </div>
        ) : (
          fila.map((chamado) => (
            <div
              key={chamado.id}
              className={`fila-item ${
                chamadoAtual?.id === chamado.id ? "ativo" : ""
              } ${chamado.status}`}
              onClick={() => onSelect(chamado)}
            >
              <div className="fila-item-header">
                <strong>{chamado.cliente.nome}</strong>
                <span className="status-label">{chamado.status}</span>
              </div>
              <div className="fila-item-body">
                <div>📱 {chamado.cliente.telefone}</div>
                <div>🏢 {chamado.sistema}</div>
                <div className="origem-badge">
                  {chamado.origem === "whatsapp" ? "💬" : "🌐"} {chamado.origem}
                </div>
              </div>
              <div className="fila-item-footer">
                {new Date(chamado.criadoEm).toLocaleTimeString("pt-BR")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
