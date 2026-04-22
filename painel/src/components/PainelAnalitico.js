import "./PainelAnalitico.css";

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export default function PainelAnalitico({ metricas }) {
  if (!metricas) return null;

  const totalChamados = metricas.totalChamados || 0;
  const finalizados = metricas.finalizados || 0;
  const aguardando = metricas.aguardando || 0;
  const emAtendimento = metricas.emAtendimento || 0;

  const taxaResolucao = Number.isFinite(metricas.taxaResolucao)
    ? clampPercent(metricas.taxaResolucao)
    : (totalChamados > 0 ? clampPercent((finalizados / totalChamados) * 100) : 0);

  const eficienciaOperacional = Number.isFinite(metricas.eficienciaOperacional)
    ? clampPercent(metricas.eficienciaOperacional)
    : clampPercent(100 - (aguardando * 5));

  const satisfacao = clampPercent(70 + (taxaResolucao - (aguardando * 2.5)));

  const barras = [
    { label: "Aguardando", valor: aguardando, cor: "#f59e0b" },
    { label: "Em atendimento", valor: emAtendimento, cor: "#3b82f6" },
    { label: "Finalizados", valor: finalizados, cor: "#22c55e" }
  ];

  const maxBar = Math.max(...barras.map((b) => b.valor), 1);

  return (
    <section className="painel-analitico">
      <h2>Painel Administrativo e Analítico</h2>

      <div className="analitico-grid">
        <article className="analitico-card">
          <h3>Gráficos</h3>
          <p className="card-subtitle">Distribuição de chamados por status</p>
          <div className="bar-chart">
            {barras.map((barra) => (
              <div key={barra.label} className="bar-row">
                <span>{barra.label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(barra.valor / maxBar) * 100}%`,
                      backgroundColor: barra.cor
                    }}
                  />
                </div>
                <strong>{barra.valor}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="analitico-card">
          <h3>KPI</h3>
          <ul className="kpi-list">
            <li><span>Taxa de resolução</span> <strong>{taxaResolucao.toFixed(1)}%</strong></li>
            <li><span>Backlog aberto</span> <strong>{(totalChamados - finalizados).toFixed(0)}</strong></li>
            <li><span>Eficiência operacional</span> <strong>{eficienciaOperacional.toFixed(1)}%</strong></li>
          </ul>
        </article>

        <article className="analitico-card">
          <h3>Satisfação</h3>
          <p className="satisfacao-score">{satisfacao.toFixed(1)}%</p>
          <p>Indicador estimado com base em resolução e fila pendente.</p>
        </article>

        <article className="analitico-card">
          <h3>BPMN</h3>
          <ol className="bpmn-flow">
            <li>Entrada do chamado</li>
            <li>Triagem automática</li>
            <li>Atendimento técnico</li>
            <li>Validação da solução</li>
            <li>Encerramento</li>
          </ol>
        </article>

        <article className="analitico-card full-width">
          <h3>Melhorias sugeridas</h3>
          <ul>
            <li>Priorizar chamados antigos acima de 30 minutos.</li>
            <li>Criar alerta de SLA quando fila atingir 5+ chamados aguardando.</li>
            <li>Aplicar pesquisa de satisfação ao final de cada atendimento.</li>
            <li>Usar base de conhecimento para respostas rápidas de primeiro nível.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
