import "./Metricas.css";

export default function Metricas({ metricas }) {
  if (!metricas) return null;

  const tempoMedioMin = Number.isFinite(metricas.tempoMedio)
    ? (metricas.tempoMedio / 1000 / 60).toFixed(1)
    : "0.0";

  const tempoEsperaMedioMin = Number.isFinite(metricas.tempoEsperaMedio)
    ? (metricas.tempoEsperaMedio / 1000 / 60).toFixed(1)
    : "0.0";

  return (
    <div className="metricas">
      <div className="metrica-item">
        <div className="metrica-value">{metricas.totalChamados}</div>
        <div className="metrica-label">Total de Chamados</div>
      </div>

      <div className="metrica-item">
        <div className="metrica-value" style={{ color: "#fbbf24" }}>
          {metricas.aguardando}
        </div>
        <div className="metrica-label">Aguardando</div>
      </div>

      <div className="metrica-item">
        <div className="metrica-value" style={{ color: "#60a5fa" }}>
          {metricas.emAtendimento}
        </div>
        <div className="metrica-label">Em Atendimento</div>
      </div>

      <div className="metrica-item">
        <div className="metrica-value" style={{ color: "#4ade80" }}>
          {metricas.finalizados}
        </div>
        <div className="metrica-label">Finalizados</div>
      </div>

      <div className="metrica-item">
        <div className="metrica-value">
          {tempoMedioMin}m
        </div>
        <div className="metrica-label">Tempo Médio</div>
      </div>

      <div className="metrica-item">
        <div className="metrica-value">
          {tempoEsperaMedioMin}m
        </div>
        <div className="metrica-label">Tempo Espera</div>
      </div>
    </div>
  );
}
