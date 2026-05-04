import React, { useState, useEffect } from "react";
import "./HistoricoCliente.css";
import GraficosAtendimento from "./GraficosAtendimento";

export default function HistoricoCliente({ clienteTelefone, onVoltar }) {
  const [historico, setHistorico] = useState(null);
  const [mesStats, setMesStats] = useState(null);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [carregando, setCarregando] = useState(true);
  const [abaSelecionada, setAbaSelecionada] = useState("resumo");
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    carregarHistorico();
  }, [clienteTelefone]);

  useEffect(() => {
    if (historico) {
      carregarEstatisticasMes();
    }
  }, [mesAtual, historico]);

  async function carregarHistorico() {
    try {
      setCarregando(true);
      const response = await fetch(
        `http://localhost:3001/historico/${clienteTelefone}`
      );
      if (response.ok) {
        const dados = await response.json();
        setHistorico(dados);
      } else {
        console.error("Erro ao carregar histórico");
      }
    } catch (erro) {
      console.error("Erro:", erro);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarEstatisticasMes() {
    try {
      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth() + 1;
      const response = await fetch(
        `http://localhost:3001/historico/${clienteTelefone}/mes/${ano}/${mes}`
      );
      if (response.ok) {
        const dados = await response.json();
        setMesStats(dados);
      }
    } catch (erro) {
      console.error("Erro ao carregar estatísticas:", erro);
    }
  }

  function navegarMes(direcao) {
    const novo = new Date(mesAtual);
    novo.setMonth(novo.getMonth() + direcao);
    setMesAtual(novo);
  }

  function formatarData(dataString) {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function gerarRelatorioPDF() {
    try {
      setGerando(true);
      const ano = mesAtual.getFullYear();
      const mes = mesAtual.getMonth() + 1;

      // Gerar PDF no backend
      const responseGerar = await fetch(
        `http://localhost:3001/gerar-relatorio-pdf/${clienteTelefone}/${ano}/${mes}`,
        { method: "POST" }
      );

      if (responseGerar.ok) {
        const dados = await responseGerar.json();

        // Fazer download
        const responseDl = await fetch(
          `http://localhost:3001/download-relatorio/${clienteTelefone}/${ano}/${mes}`
        );

        if (responseDl.ok) {
          const blob = await responseDl.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = dados.nomeArquivo || `relatorio_${clienteTelefone}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          alert("✅ Relatório PDF baixado com sucesso!");
        }
      } else {
        alert("❌ Erro ao gerar relatório PDF");
      }
    } catch (erro) {
      console.error("Erro:", erro);
      alert("❌ Erro ao gerar relatório");
    } finally {
      setGerando(false);
    }
  }

  if (carregando) {
    return (
      <div className="historico-container">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <div className="loading">Carregando histórico...</div>
      </div>
    );
  }

  if (!historico) {
    return (
      <div className="historico-container">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <div className="erro">Nenhum histórico encontrado para este cliente</div>
      </div>
    );
  }

  return (
    <div className="historico-container">
      <div className="historico-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <div className="info-cliente">
          <h2>{historico.nome_cliente || "Cliente"}</h2>
          <p className="telefone">{clienteTelefone}</p>
        </div>
      </div>

      <div className="abas">
        <button
          className={`aba ${abaSelecionada === "resumo" ? "ativa" : ""}`}
          onClick={() => setAbaSelecionada("resumo")}
        >
          📋 Resumo
        </button>
        <button
          className={`aba ${abaSelecionada === "graficos" ? "ativa" : ""}`}
          onClick={() => setAbaSelecionada("graficos")}
        >
          📈 Gráficos
        </button>
        <button
          className={`aba ${abaSelecionada === "duvidas" ? "ativa" : ""}`}
          onClick={() => setAbaSelecionada("duvidas")}
        >
          ❓ Dúvidas Frequentes
        </button>
      </div>

      {abaSelecionada === "resumo" && (
        <div className="conteudo">
          <div className="resumo-grid">
            <div className="card-resumo">
              <h3>Total de Atendimentos</h3>
              <p className="numero">{historico.total_atendimentos || 0}</p>
            </div>

            <div className="card-resumo">
              <h3>Tempo Médio de Atendimento</h3>
              <p className="numero">
                {historico.tempo_medio_atendimento?.toFixed(0) || 0} min
              </p>
            </div>

            <div className="card-resumo">
              <h3>Atendimentos Este Mês</h3>
              <p className="numero">{historico.atendimentos_mes || 0}</p>
            </div>

            <div className="card-resumo">
              <h3>Última Interação</h3>
              <p className="data">{formatarData(historico.ultima_interacao)}</p>
            </div>
          </div>

          <div className="mes-stats">
            <div className="mes-header">
              <button onClick={() => navegarMes(-1)}>←</button>
              <h3>
                {mesAtual.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric"
                })}
              </h3>
              <button onClick={() => navegarMes(1)}>→</button>
            </div>

            <button
              className="btn-gerar-pdf"
              onClick={gerarRelatorioPDF}
              disabled={gerando}
            >
              {gerando ? "⏳ Gerando..." : "📄 Gerar PDF"}
            </button>

            {mesStats && (
              <div className="mes-detalhes">
                <div className="det">
                  <strong>Dias com atendimento:</strong> {mesStats.total_dias_com_atendimento}
                </div>
                <div className="det">
                  <strong>Total de atendimentos:</strong> {mesStats.total_atendimentos}
                </div>
                <div className="det">
                  <strong>Tempo total:</strong> {mesStats.tempo_total_minutos} min
                </div>
                <div className="det">
                  <strong>Tempo médio:</strong>
                  {(mesStats.tempo_total_minutos / Math.max(mesStats.total_atendimentos, 1)).toFixed(0)} min
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {abaSelecionada === "graficos" && (
        <div className="conteudo">
          {mesStats && <GraficosAtendimento dados={mesStats} />}
        </div>
      )}

      {abaSelecionada === "duvidas" && (
        <div className="conteudo">
          <div className="duvidas-list">
            <h3>Dúvidas Mais Frequentes</h3>
            {historico.duvidas_frequentes && historico.duvidas_frequentes.length > 0 ? (
              <ul>
                {historico.duvidas_frequentes.map((duvida, idx) => (
                  <li key={idx} className="duvida-item">
                    <span className="numero-duvida">{duvida.frequencia}</span>
                    <span className="texto-duvida">{duvida.texto}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sem-dados">Nenhuma dúvida registrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
