const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const { chamados, atendentes } = require("./dados");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});


// ==========================
// 📌 CRIAR CHAMADO
// ==========================
app.post("/chamado", (req, res) => {
  const { nome, telefone, sistema, origem } = req.body;

  const novo = {
    id: uuidv4(),
    cliente: { nome, telefone },
    sistema,
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
