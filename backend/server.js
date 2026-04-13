const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const { chamados, atendentes, manuais, conversasLiberadas } = require("./dados");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
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
app.post("/chamado", (req, res) => {
  const { nome, telefone, sistema, origem, etiqueta } = req.body;

  const novo = {
    id: uuidv4(),
    cliente: { nome, telefone },
    sistema,
    etiqueta: etiqueta || null,
    origem, // whatsapp ou web
    status: "aguardando",
    atendenteId: null,

    criadoEm: new Date(),
    iniciadoEm: null,
    finalizadoEm: null,

    mensagens: []
  };

  chamados.push(novo);

  io.emit("fila", chamados);

  distribuir();

  res.json(novo);
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
app.post("/atendente/disponivel", (req, res) => {
  const { atendenteId } = req.body;

  let at = atendentes.find(a => a.id === atendenteId);

  if (!at) {
    at = { id: atendenteId, status: "livre" };
    atendentes.push(at);
  } else {
    at.status = "livre";
  }

  distribuir();

  res.sendStatus(200);
});


// ==========================
// 🏁 FINALIZAR
// ==========================
app.post("/finalizar", (req, res) => {
  const { chamadoId, atendenteId } = req.body;

  const chamado = chamados.find(c => c.id === chamadoId);
  if (chamado) {
    chamado.status = "finalizado";
    chamado.finalizadoEm = new Date();
  }

  const at = atendentes.find(a => a.id === atendenteId);
  if (at) at.status = "livre";

  distribuir();

  res.sendStatus(200);
});


// ==========================
// 📊 MÉTRICAS
// ==========================
app.get("/metricas", (req, res) => {
  const finalizados = chamados.filter(c => c.status === "finalizado");

  const tempoMedio = finalizados.length
    ? finalizados.reduce((acc, c) => {
        return acc + (c.finalizadoEm - c.iniciadoEm);
      }, 0) / finalizados.length
    : 0;

  const tempoEsperaMedio = finalizados.length
    ? finalizados.reduce((acc, c) => {
        return acc + (c.iniciadoEm - c.criadoEm);
      }, 0) / finalizados.length
    : 0;

  res.json({
    totalChamados: chamados.length,
    finalizados: finalizados.length,
    emAtendimento: chamados.filter(c => c.status === "em_atendimento").length,
    aguardando: chamados.filter(c => c.status === "aguardando").length,
    tempoMedio,
    tempoEsperaMedio
  });
});


// ==========================
// 🔄 DISTRIBUIÇÃO AUTOMÁTICA
// ==========================
function distribuir() {
  const livre = atendentes.find(a => a.status === "livre");
  const chamado = chamados.find(c => c.status === "aguardando");

  if (livre && chamado) {
    chamado.status = "em_atendimento";
    chamado.atendenteId = livre.id;
    chamado.iniciadoEm = new Date();

    livre.status = "ocupado";

    io.to(chamado.id).emit("inicio", chamado);
    io.emit("fila", chamados);
  }
}


// ==========================
// 💬 SOCKET CHAT
// ==========================
io.on("connection", (socket) => {

  socket.on("entrar", (chamadoId) => {
    socket.join(chamadoId);
  });

  socket.on("mensagem", (msg) => {
    const chamado = chamados.find(c => c.id === msg.chamadoId);

    if (!chamado) return;

    chamado.mensagens.push({
      texto: msg.texto,
      de: msg.de,
      data: new Date()
    });

    io.to(msg.chamadoId).emit("mensagem", msg);

    // 🔥 AQUI depois entra WhatsApp (Baileys)
    // if (msg.de === "atendente") enviarWhatsapp(...)
  });

});


server.listen(3000, () => {
  console.log("🚀 Backend rodando na porta 3000");
});
