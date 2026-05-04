import React, { useEffect, useState } from "react";
import "./GraficosAtendimento.css";

export default function GraficosAtendimento({ dados }) {
  const [dataGrafico, setDataGrafico] = useState(null);

  useEffect(() => {
    if (dados && dados.dias) {
      processarDados();
    }
  }, [dados]);

  function processarDados() {
    if (!dados.dias || dados.dias.length === 0) return;

    const diasData = dados.dias.map((d) => ({
      dia: new Date(d.data).getDate(),
      atendimentos: d.total_atendimentos,
      tempo: d.tempo_total_minutos
    }));

    setDataGrafico(diasData);
  }

  if (!dataGrafico || dataGrafico.length === 0) {
    return <div className="grafico-container">Nenhum dado disponível para este mês</div>;
  }

  // Encontrar o máximo de atendimentos para escala
  const maxAtendimentos = Math.max(...dataGrafico.map((d) => d.atendimentos));
  const maxTempo = Math.max(...dataGrafico.map((d) => d.tempo));

  return (
    <div className="grafico-container">
      <div className="grafico-section">
        <h3>Atendimentos por Dia</h3>
        <div className="grafico-barras">
          <div className="eixo-y">
            <div className="marca">0</div>
            <div className="marca" style={{ top: "25%" }}>
              {Math.round(maxAtendimentos * 0.75)}
            </div>
            <div className="marca" style={{ top: "50%" }}>
              {Math.round(maxAtendimentos * 0.5)}
            </div>
            <div className="marca" style={{ top: "75%" }}>
              {Math.round(maxAtendimentos * 0.25)}
            </div>
            <div className="marca">{maxAtendimentos}</div>
          </div>

          <div className="barras">
            {dataGrafico.map((dado, idx) => (
              <div key={idx} className="barra-container">
                <div
                  className="barra"
                  style={{
                    height: `${(dado.atendimentos / maxAtendimentos) * 200}px`,
                    backgroundColor: `hsl(${(idx / dataGrafico.length) * 360}, 70%, 50%)`
                  }}
                  title={`Dia ${dado.dia}: ${dado.atendimentos} atendimentos`}
                />
                <span className="label-dia">{dado.dia}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="label-eixo-x">Dias do Mês</p>
      </div>

      <div className="grafico-section">
        <h3>Tempo Total por Dia (minutos)</h3>
        <div className="grafico-linhas">
          {dataGrafico.map((dado, idx) => (
            <div key={idx} className="linha-item">
              <span className="dia-label">Dia {dado.dia}</span>
              <div
                className="barra-tempo"
                style={{
                  width: `${(dado.tempo / maxTempo) * 300}px`
                }}
              >
                <span className="tempo-valor">{dado.tempo}min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="resumo-graficos">
        <h3>Resumo do Mês</h3>
        <div className="resumo-grid">
          <div className="resumo-item">
            <span className="label">Dias com atendimento</span>
            <span className="valor">{dataGrafico.length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Total de atendimentos</span>
            <span className="valor">
              {dataGrafico.reduce((sum, d) => sum + d.atendimentos, 0)}
            </span>
          </div>
          <div className="resumo-item">
            <span className="label">Tempo total</span>
            <span className="valor">
              {dataGrafico.reduce((sum, d) => sum + d.tempo, 0)}min
            </span>
          </div>
          <div className="resumo-item">
            <span className="label">Tempo médio/dia</span>
            <span className="valor">
              {(dataGrafico.reduce((sum, d) => sum + d.tempo, 0) / dataGrafico.length).toFixed(0)}
              min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
