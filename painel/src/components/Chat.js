import "./Chat.css";

export default function Chat({
  chamado,
  mensagens,
  mensagem,
  onMensagemChange,
  onEnviar,
  onFinalizar,
  loading
}) {
  if (!chamado) {
    return (
      <div className="chat">
        <div className="chat-vazio">
          <h2>👋 Selecione um chamado</h2>
          <p>Escolha um chamado da fila para começar o atendimento</p>
        </div>
      </div>
    );
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnviar();
    }
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>{chamado.cliente.nome}</h2>
          <p>{chamado.cliente.telefone} • {chamado.sistema}</p>
        </div>
        <div className="chat-header-actions">
          <button
            className="btn btn-primary"
            onClick={onFinalizar}
            disabled={loading}
          >
            {loading ? "⏳ Finalizando..." : "✓ Finalizar"}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {mensagens.length === 0 ? (
          <div className="chat-messages-vazio">
            <p>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          mensagens.map((msg, i) => (
            <div
              key={i}
              className={`chat-message ${msg.de === "atendente" ? "atendente" : "cliente"}`}
            >
              <div className="chat-message-content">
                <span className="chat-message-sender">{msg.de}</span>
                <p>{msg.texto}</p>
                <span className="chat-message-time">
                  {new Date(msg.data).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="chat-input">
        <textarea
          value={mensagem}
          onChange={(e) => onMensagemChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem... (Shift+Enter para quebra de linha)"
          rows="3"
        />
        <button
          className="btn btn-send"
          onClick={onEnviar}
          disabled={!mensagem.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
