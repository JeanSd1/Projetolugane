import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

import Header from "./components/Header";
import Fila from "./components/Fila";
import Chat from "./components/Chat";
import Metricas from "./components/Metricas";
import ListaClientes from "./components/ListaClientes";
import HistoricoCliente from "./components/HistoricoCliente";

const socket = io("http://localhost:3001");

function App() {
  const [fila, setFila] = useState([]);
  const [chat, setChat] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [chamadoAtual, setChamadoAtual] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tela, setTela] = useState("fila"); // "fila", "historico", "cliente-detalhes"
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const atendenteId = "atendente-1";

  // Inicializar
  useEffect(() => {
    // Conectar ao socket
    socket.on("fila", setFila);
    socket.on("mensagem", (msg) => {
      setChat((prev) => [...prev, msg]);
    });
    socket.on("inicio", (chamado) => {
      setChamadoAtual(chamado);
      setChat([]);
    });

    // Marcar atendente como disponível
    axios.post("http://localhost:3001/atendente/disponivel", {
      atendenteId
    }).catch(err => console.error("Erro ao conectar:", err));

    // Buscar métricas periodicamente
    const interval = setInterval(() => {
      axios.get("http://localhost:3001/metricas")
        .then(res => setMetricas(res.data))
        .catch(err => console.error("Erro ao buscar métricas:", err));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const abrirChamado = (c) => {
    setChamadoAtual(c);
    setChat(c.mensagens || []);
    socket.emit("entrar", c.id);
  };

  const enviarMensagem = () => {
    if (!mensagem.trim() || !chamadoAtual) return;

    socket.emit("mensagem", {
      chamadoId: chamadoAtual.id,
      texto: mensagem,
      de: "atendente"
    });
    setMensagem("");
  };

  const finalizarChamado = async () => {
    if (!chamadoAtual) return;
    
    setLoading(true);
    try {
      await axios.post("http://localhost:3001/finalizar", {
        chamadoId: chamadoAtual.id,
        atendenteId
      });
      setChamadoAtual(null);
      setChat([]);
      setMensagem("");
    } catch (err) {
      console.error("Erro ao finalizar:", err);
    }
    setLoading(false);
  };

  const abrirHistorico = () => {
    setTela("historico");
  };

  const abrirClienteDetalhes = (telefone, nome) => {
    setClienteSelecionado({ telefone, nome });
    setTela("cliente-detalhes");
  };

  const voltarParaFila = () => {
    setTela("fila");
    setClienteSelecionado(null);
  };

  // Renderizar a tela correta
  if (tela === "historico") {
    return (
      <div className="app">
        <Header />
        <div className="container-historico">
          <ListaClientes onClienteSelecionado={abrirClienteDetalhes} />
          <button className="btn-voltar-fila" onClick={voltarParaFila}>
            ← Voltar para Fila
          </button>
        </div>
      </div>
    );
  }

  if (tela === "cliente-detalhes" && clienteSelecionado) {
    return (
      <div className="app">
        <Header />
        <div className="container-historico">
          <HistoricoCliente
            clienteTelefone={clienteSelecionado.telefone}
            onVoltar={() => setTela("historico")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <Metricas metricas={metricas} />

      <div className="container">
        <div className="fila-chat-wrapper">
          <Fila 
            fila={fila} 
            chamadoAtual={chamadoAtual}
            onSelect={abrirChamado} 
          />

          <Chat
            chamado={chamadoAtual}
            mensagens={chat}
            mensagem={mensagem}
            onMensagemChange={setMensagem}
            onEnviar={enviarMensagem}
            onFinalizar={finalizarChamado}
            loading={loading}
          />
        </div>

        <button className="btn-historico-flutuante" onClick={abrirHistorico}>
          📊 Histórico de Clientes
        </button>
      </div>
    </div>
  );
}

export default App;
