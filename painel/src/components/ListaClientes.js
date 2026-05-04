import React, { useState, useEffect } from "react";
import "./ListaClientes.css";

export default function ListaClientes({ onClienteSelecionado }) {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    carregarClientes();
    // Atualizar a cada 30 segundos
    const intervalo = setInterval(carregarClientes, 30000);
    return () => clearInterval(intervalo);
  }, []);

  async function carregarClientes() {
    try {
      const response = await fetch("http://localhost:3001/historico");
      if (response.ok) {
        const dados = await response.json();
        setClientes(dados);
      }
    } catch (erro) {
      console.error("Erro ao carregar clientes:", erro);
    } finally {
      setCarregando(false);
    }
  }

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome_cliente?.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.telefone?.includes(filtro)
  );

  function formatarTempo(minutos) {
    if (!minutos) return "0 min";
    if (minutos < 60) return Math.round(minutos) + " min";
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}min`;
  }

  function formatarUltimaInteracao(dataString) {
    if (!dataString) return "-";
    const data = new Date(dataString);
    const agora = new Date();
    const diff = agora - data;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return "Agora";
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    return `${dias}d atrás`;
  }

  if (carregando) {
    return <div className="lista-loading">Carregando clientes...</div>;
  }

  return (
    <div className="lista-clientes">
      <div className="lista-header">
        <h2>📋 Histórico de Clientes</h2>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-input"
        />
        <button className="btn-atualizar" onClick={carregarClientes}>
          🔄 Atualizar
        </button>
      </div>

      {clientesFiltrados.length === 0 ? (
        <div className="sem-clientes">
          {clientes.length === 0
            ? "Nenhum cliente com histórico ainda"
            : "Nenhum cliente correspondente ao filtro"}
        </div>
      ) : (
        <div className="clientes-table">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Total Atendimentos</th>
                <th>Tempo Médio</th>
                <th>Atendimentos Mês</th>
                <th>Última Interação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.telefone}>
                  <td>
                    <span className="cliente-nome">
                      {cliente.nome_cliente || "Cliente"}
                    </span>
                  </td>
                  <td>
                    <code className="telefone-codigo">{cliente.telefone}</code>
                  </td>
                  <td className="numero">{cliente.total_atendimentos || 0}</td>
                  <td className="numero">
                    {formatarTempo(cliente.tempo_medio_atendimento)}
                  </td>
                  <td className="numero">{cliente.atendimentos_mes || 0}</td>
                  <td className="tempo-relativo">
                    {formatarUltimaInteracao(cliente.ultima_interacao)}
                  </td>
                  <td>
                    <button
                      className="btn-ver-historico"
                      onClick={() =>
                        onClienteSelecionado(cliente.telefone, cliente.nome_cliente)
                      }
                    >
                      Ver Histórico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="lista-footer">
        <p>Total de clientes: {clientes.length}</p>
      </div>
    </div>
  );
}
