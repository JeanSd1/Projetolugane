const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const db = require("./database");
const { gerarRelatorioPDF, pdfDir } = require("./gerar-pdf");

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos PDF
app.use("/relatorios-pdf", express.static(pdfDir));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Emitir fila atual quando um cliente se conecta
io.on("connection", async (socket) => {
  try {
    const chamados = await db.obterChamados();
    socket.emit("fila", chamados);
  } catch (err) {
    console.error("Erro ao enviar fila inicial:", err);
  }
});

function normalizarTexto(texto = "") {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function pontuarCorrespondencia(buscaNormalizada, secao) {
  const tokens = buscaNormalizada.split(/\s+/).filter(Boolean);
  const indice = `${secao.sistema} ${secao.etiqueta} ${secao.titulo} ${secao.descricao}`.toLowerCase();

  return tokens.reduce((score, token) => {
    if (indice.includes(token)) return score + 1;
    return score;
  }, 0);
}

function obterConfigPublicAI() {
  return {
    apiKey: process.env.PUBLICAI_API_KEY || "",
    endpoint: process.env.PUBLICAI_API_URL || "https://api.publicai.co"
  };
}

function textoEhOi(texto = "") {
  return normalizarTexto(texto) === "oi";
}

function podeResponderWhatsapp(telefone, textoRecebido) {
  const contato = normalizarTexto(telefone);
  const recebeuOiAgora = textoEhOi(textoRecebido);

  if (recebeuOiAgora) {
    conversasLiberadas.add(contato);
    return true;
  }

  return conversasLiberadas.has(contato);
}

// ==========================
// 📌 CRIAR CHAMADO
// ==========================
app.post("/chamado", async (req, res) => {
  try {
    const { nome, telefone, sistema, origem, etiqueta } = req.body;

    const novo = {
      id: uuidv4(),
      cliente: { nome, telefone },
      sistema,
      etiqueta: etiqueta || null,
      origem,
      status: "aguardando",
      atendenteId: null,
      mensagens: []
    };

    await db.criarChamado(novo);

    const chamados = await db.obterChamados();
    io.emit("fila", chamados);

    await distribuir();

    res.json(novo);
  } catch (err) {
    console.error("Erro ao criar chamado:", err);
    res.status(500).json({ erro: "Erro ao criar chamado" });
  }
});

// ==========================
// 📘 MANUAIS (BASE DE CONHECIMENTO)
// ==========================
app.post("/manuais/secao", (req, res) => {
  const { sistema, etiqueta, titulo, descricao, link } = req.body;

  if (!sistema || !etiqueta || !titulo || !link) {
    return res.status(400).json({
      erro: "Campos obrigatórios: sistema, etiqueta, titulo, link"
    });
  }

  const secao = {
    id: uuidv4(),
    sistema: normalizarTexto(sistema),
    etiqueta: normalizarTexto(etiqueta),
    titulo,
    descricao: descricao || "",
    link
  };

  manuais.push(secao);
  return res.status(201).json(secao);
});

app.get("/manuais/secao", (_req, res) => {
  return res.json(manuais);
});

app.post("/manuais/sugerir", (req, res) => {
  const { sistema, etiqueta, texto } = req.body;
  const sistemaNormalizado = normalizarTexto(sistema);
  const etiquetaNormalizada = normalizarTexto(etiqueta);
  const textoNormalizado = normalizarTexto(texto);

  if (!sistemaNormalizado || (!etiquetaNormalizada && !textoNormalizado)) {
    return res.status(400).json({
      erro: "Informe sistema e ao menos um entre etiqueta ou texto"
    });
  }

  const candidatos = manuais
    .filter((secao) => secao.sistema === sistemaNormalizado)
    .map((secao) => {
      let score = 0;

      if (etiquetaNormalizada && secao.etiqueta.includes(etiquetaNormalizada)) {
        score += 5;
      }

      if (textoNormalizado) {
        score += pontuarCorrespondencia(textoNormalizado, secao);
      }

      return { ...secao, score };
    })
    .filter((secao) => secao.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return res.json({
    sistema: sistemaNormalizado,
    totalSugestoes: candidatos.length,
    sugestoes: candidatos
  });
});

// ==========================
// 📌 FINALIZAR CHAMADO
// ==========================
app.put("/chamado/:id/finalizar", async (req, res) => {
  const { id } = req.params;
  try {
    await db.finalizarChamado(id);
    const chamados = await db.obterChamados();
    io.emit("fila", chamados);
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao finalizar chamado:", err);
    res.status(500).json({ erro: "Erro ao finalizar chamado" });
  }
});

// ==========================
// 🤖 INTEGRAÇÃO PUBLICAI
// ==========================
app.get("/integracoes/publicai/status", (_req, res) => {
  const config = obterConfigPublicAI();
  return res.json({
    configurado: Boolean(config.apiKey),
    endpoint: config.endpoint,
    regraDisparo: "só responde depois de receber 'oi'",
    postarStatusWhatsapp: false
  });
});

app.post("/integracoes/publicai/responder", (req, res) => {
  const { telefone, textoRecebido, sistema, etiqueta } = req.body;
  const config = obterConfigPublicAI();

  if (!config.apiKey) {
    return res.status(400).json({
      erro: "PUBLICAI_API_KEY não configurada no ambiente do backend"
    });
  }

  if (!telefone || !textoRecebido) {
    return res.status(400).json({
      erro: "Campos obrigatórios: telefone, textoRecebido"
    });
  }

  if (!podeResponderWhatsapp(telefone, textoRecebido)) {
    return res.status(403).json({
      bloqueado: true,
      motivo: "Aguardando mensagem inicial 'oi' do cliente antes de qualquer resposta"
    });
  }

  const sistemaNormalizado = normalizarTexto(sistema);
  const etiquetaNormalizada = normalizarTexto(etiqueta);
  const textoNormalizado = normalizarTexto(textoRecebido);

  const sugestoes = manuais
    .filter((secao) => !sistemaNormalizado || secao.sistema === sistemaNormalizado)
    .map((secao) => {
      let score = 0;
      if (etiquetaNormalizada && secao.etiqueta.includes(etiquetaNormalizada)) score += 5;
      score += pontuarCorrespondencia(textoNormalizado, secao);
      return { ...secao, score };
    })
    .filter((secao) => secao.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return res.json({
    respostaAutomaticaHabilitada: true,
    postarStatusWhatsapp: false,
    sugestoes
  });
});


// ==========================
// 👨‍💻 ATENDENTE DISPONÍVEL
// ==========================
app.post("/atendente/disponivel", async (req, res) => {
  try {
    const { atendenteId } = req.body;
    await db.marcarAtendente(atendenteId, "livre");
    await distribuir();
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao marcar atendente:", err);
    res.status(500).json({ erro: "Erro ao marcar atendente" });
  }
});


// ==========================
// 🏁 FINALIZAR
// ==========================
app.post("/finalizar", async (req, res) => {
  try {
    const { chamadoId, atendenteId } = req.body;

    await db.atualizarStatusChamado(chamadoId, "finalizado");
    
    // Atualizar histórico do cliente
    try {
      await db.atualizarHistoricoAposFinalizacao(chamadoId);
    } catch (err) {
      console.error("⚠️ Erro ao atualizar histórico do cliente:", err);
      // Não falha a finalização se o histórico não for atualizado
    }

    await db.marcarAtendente(atendenteId, "livre");

    const chamados = await db.obterChamados();
    io.emit("fila", chamados);

    await distribuir();

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao finalizar:", err);
    res.status(500).json({ erro: "Erro ao finalizar" });
  }
});


// ==========================
// 📊 MÉTRICAS
// ==========================
app.get("/metricas", async (req, res) => {
  try {
    const chamados = await db.obterChamados();
    const finalizados = chamados.filter(c => c.status === "finalizado");
    const emAtendimento = chamados.filter(c => c.status === "em_atendimento");
    const aguardando = chamados.filter(c => c.status === "aguardando");

    res.json({
      totalChamados: chamados.length,
      finalizados: finalizados.length,
      emAtendimento: emAtendimento.length,
      aguardando: aguardando.length
    });
  } catch (err) {
    console.error("Erro ao buscar métricas:", err);
    res.status(500).json({ erro: "Erro ao buscar métricas" });
  }
});


// ==========================
// � MANUAIS / BASE DE CONHECIMENTO
// ==========================

// ➕ Criar novo manual
app.post("/manuais", async (req, res) => {
  try {
    const { sistema, titulo, palavrasChave, link } = req.body;

    if (!sistema || !titulo) {
      return res.status(400).json({ erro: "Sistema e título são obrigatórios" });
    }

    const resultado = await db.adicionarManual(sistema, titulo, palavrasChave, link);
    res.status(201).json(resultado);
  } catch (err) {
    console.error("Erro ao criar manual:", err);
    res.status(500).json({ erro: "Erro ao criar manual" });
  }
});

// 📖 Obter todos os manuais
app.get("/manuais", async (req, res) => {
  try {
    const manuais = await db.obterManuais();
    res.json(manuais);
  } catch (err) {
    console.error("Erro ao obter manuais:", err);
    res.status(500).json({ erro: "Erro ao obter manuais" });
  }
});

// 🔍 Buscar manuais por palavras-chave
app.get("/manuais/buscar", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ erro: "Parâmetro 'q' é obrigatório" });
    }

    const manuais = await db.buscarManuaisPorPalavrasChave(q);
    res.json(manuais);
  } catch (err) {
    console.error("Erro ao buscar manuais:", err);
    res.status(500).json({ erro: "Erro ao buscar manuais" });
  }
});

// 🏢 Obter manuais por sistema
app.get("/manuais/sistema/:sistema", async (req, res) => {
  try {
    const { sistema } = req.params;
    const manuais = await db.obterManuaisPorSistema(sistema);
    res.json(manuais);
  } catch (err) {
    console.error("Erro ao obter manuais por sistema:", err);
    res.status(500).json({ erro: "Erro ao obter manuais por sistema" });
  }
});

// 📄 Obter manual por ID
app.get("/manuais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const manual = await db.obterManualPorId(id);

    if (!manual) {
      return res.status(404).json({ erro: "Manual não encontrado" });
    }

    res.json(manual);
  } catch (err) {
    console.error("Erro ao obter manual:", err);
    res.status(500).json({ erro: "Erro ao obter manual" });
  }
});

// ✏️ Atualizar manual
app.put("/manuais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sistema, titulo, palavrasChave, link } = req.body;

    if (!sistema || !titulo) {
      return res.status(400).json({ erro: "Sistema e título são obrigatórios" });
    }

    const resultado = await db.atualizarManual(id, sistema, titulo, palavrasChave, link);
    res.json(resultado);
  } catch (err) {
    console.error("Erro ao atualizar manual:", err);
    res.status(500).json({ erro: "Erro ao atualizar manual" });
  }
});

// 🗑️ Deletar manual
app.delete("/manuais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await db.deletarManual(id);
    res.json(resultado);
  } catch (err) {
    console.error("Erro ao deletar manual:", err);
    res.status(500).json({ erro: "Erro ao deletar manual" });
  }
});


// ==========================// 📊 HISTÓRICO DE CLIENTES
// ==========================

// GET - Obter histórico de um cliente
app.get("/historico/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;
    const historico = await db.obterHistoricoCliente(telefone);
    
    if (!historico) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    res.json(historico);
  } catch (err) {
    console.error("Erro ao obter histórico:", err);
    res.status(500).json({ erro: "Erro ao obter histórico" });
  }
});

// GET - Listar todos os clientes com histórico
app.get("/historico", async (req, res) => {
  try {
    const clientes = await db.obterTodosClientes();
    res.json(clientes);
  } catch (err) {
    console.error("Erro ao listar clientes:", err);
    res.status(500).json({ erro: "Erro ao listar clientes" });
  }
});

// GET - Obter estatísticas de um mês específico
app.get("/historico/:telefone/mes/:ano/:mes", async (req, res) => {
  try {
    const { telefone, ano, mes } = req.params;
    const stats = await db.obterEstatisticasMes(telefone, parseInt(ano), parseInt(mes));
    res.json(stats);
  } catch (err) {
    console.error("Erro ao obter estatísticas:", err);
    res.status(500).json({ erro: "Erro ao obter estatísticas" });
  }
});

// POST - Atualizar histórico após finalizar chamado
app.post("/historico/atualizar/:chamadoId", async (req, res) => {
  try {
    const { chamadoId } = req.params;
    const resultado = await db.atualizarHistoricoAposFinalizacao(chamadoId);
    res.json(resultado);
  } catch (err) {
    console.error("Erro ao atualizar histórico:", err);
    res.status(500).json({ erro: "Erro ao atualizar histórico" });
  }
});

// POST - Gerar relatório PDF mensal
app.post("/gerar-relatorio-pdf/:telefone/:ano/:mes", async (req, res) => {
  try {
    const { telefone, ano, mes } = req.params;

    // Obter histórico do cliente
    const historico = await db.obterHistoricoCliente(telefone);
    if (!historico) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    // Obter estatísticas do mês
    const estatisticasMes = await db.obterEstatisticasMes(
      telefone,
      parseInt(ano),
      parseInt(mes)
    );

    // Gerar PDF
    const resultado = await gerarRelatorioPDF(
      historico,
      estatisticasMes,
      parseInt(ano),
      parseInt(mes)
    );

    res.json({
      sucesso: true,
      mensagem: "Relatório PDF gerado com sucesso",
      downloadUrl: resultado.url,
      nomeArquivo: resultado.nomeArquivo
    });
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({ erro: "Erro ao gerar relatório PDF" });
  }
});

// GET - Fazer download do relatório PDF
app.get("/download-relatorio/:telefone/:ano/:mes", async (req, res) => {
  try {
    const { telefone, ano, mes } = req.params;
    const fs = require("fs");
    const mesStr = String(mes).padStart(2, "0");
    const anoStr = String(ano);
    const nomeArquivo = `relatorio_${telefone}_${anoStr}-${mesStr}.pdf`;
    const caminhoCompleto = path.join(pdfDir, nomeArquivo);

    // Verificar se arquivo existe
    if (!fs.existsSync(caminhoCompleto)) {
      // Gerar em tempo real se não existir
      const historico = await db.obterHistoricoCliente(telefone);
      if (!historico) {
        return res.status(404).json({ erro: "Cliente não encontrado" });
      }

      const estatisticasMes = await db.obterEstatisticasMes(
        telefone,
        parseInt(ano),
        parseInt(mes)
      );

      await gerarRelatorioPDF(
        historico,
        estatisticasMes,
        parseInt(ano),
        parseInt(mes)
      );
    }

    res.download(caminhoCompleto, nomeArquivo);
  } catch (err) {
    console.error("Erro ao fazer download:", err);
    res.status(500).json({ erro: "Erro ao fazer download" });
  }
});


// ==========================// �🔄 DISTRIBUIÇÃO AUTOMÁTICA
// ==========================
async function distribuir() {
  try {
    const atendentes = await db.obterAtendentes();
    const chamados = await db.obterChamados();

    const livre = atendentes.find(a => a.status === "livre");
    const chamado = chamados.find(c => c.status === "aguardando");

    if (livre && chamado) {
      await db.atualizarStatusChamado(chamado.id, "em_atendimento", livre.id);
      await db.marcarAtendente(livre.id, "ocupado");

      const chamadosAtualizado = await db.obterChamados();
      io.emit("fila", chamadosAtualizado);
      io.to(chamado.id).emit("inicio", chamado);
    }
  } catch (err) {
    console.error("Erro ao distribuir chamados:", err);
  }
}


// ==========================
// 💬 SOCKET CHAT
// ==========================
io.on("connection", (socket) => {

  socket.on("entrar", (chamadoId) => {
    socket.join(chamadoId);
  });

  socket.on("mensagem", async (msg) => {
    try {
      const chamado = await db.obterChamadoPorId(msg.chamadoId);

      if (!chamado) return;

      await db.adicionarMensagem(msg.chamadoId, msg.texto, msg.de);

      io.to(msg.chamadoId).emit("mensagem", msg);

      // Buscar manuais relevantes se cliente enviou
      if (msg.de === "cliente") {
        const manuais = await db.buscarManuaisPorPalavrasChave(msg.texto);
        if (manuais.length > 0) {
          io.emit("sugestoes_manuais", { chamadoId: msg.chamadoId, manuais });
        }
      }
    } catch (err) {
      console.error("Erro ao processar mensagem:", err);
    }
  });

});


server.listen(3001, () => {
  console.log("🚀 Backend rodando na porta 3001");
});
