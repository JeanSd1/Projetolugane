import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

import Header from "./components/Header";
import Fila from "./components/Fila";
import Chat from "./components/Chat";
import Metricas from "./components/Metricas";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const socket = io(API_BASE_URL);

function App() {
  const [fila, setFila] = useState([]);
  const [chat, setChat] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [chamadoAtual, setChamadoAtual] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(false);

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
    axios.post(`${API_BASE_URL}/atendente/disponivel`, {
      atendenteId
    }).catch(err => console.error("Erro ao conectar:", err));

    // Buscar métricas periodicamente
    const interval = setInterval(() => {
      axios.get(`${API_BASE_URL}/metricas`)
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
      await axios.post(`${API_BASE_URL}/finalizar`, {
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

  return (
    <div className="app">
      <Header />
      <Metricas metricas={metricas} />

      <div className="container">
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
    </div>
  );
}

export default App;
