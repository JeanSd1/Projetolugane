const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sistema_atendimento.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err);
  } else {
    console.log('✅ Banco de dados SQLite conectado');
    inicializarBanco();
  }
});

function inicializarBanco() {
  // ==========================
  // 📋 TABELA CHAMADOS
  // ==========================
  db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
      id TEXT PRIMARY KEY,
      nome_cliente TEXT NOT NULL,
      telefone TEXT NOT NULL,
      sistema TEXT,
      origem TEXT,
      status TEXT DEFAULT 'aguardando',
      atendente_id TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      iniciado_em DATETIME,
      finalizado_em DATETIME
    )
  `);

  // ==========================
  // 👨‍💻 TABELA ATENDENTES
  // ==========================
  db.run(`
    CREATE TABLE IF NOT EXISTS atendentes (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'livre',
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================
  // 💬 TABELA MENSAGENS
  // ==========================
  db.run(`
    CREATE TABLE IF NOT EXISTS mensagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chamado_id TEXT NOT NULL,
      texto TEXT NOT NULL,
      de TEXT NOT NULL,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chamado_id) REFERENCES chamados(id)
    )
  `);

  // ==========================
  // 📚 TABELA MANUAIS
  // ==========================
  db.run(`
    CREATE TABLE IF NOT EXISTS manuais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sistema TEXT NOT NULL,
      titulo TEXT NOT NULL,
      palavras_chave TEXT,
      link TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tabelas criadas/verificadas com sucesso');
}

// ==========================
// 🔧 FUNÇÕES DE BANCO DE DADOS
// ==========================

// Criar chamado
function criarChamado(chamado) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO chamados (id, nome_cliente, telefone, sistema, origem, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chamado.id, chamado.cliente.nome, chamado.cliente.telefone, chamado.sistema, chamado.origem, chamado.status],
      function(err) {
        if (err) reject(err);
        else resolve(chamado);
      }
    );
  });
}

// Obter todos os chamados
function obterChamados() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM chamados ORDER BY criado_em DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Obter chamado por ID
function obterChamadoPorId(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM chamados WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Atualizar status do chamado
function atualizarStatusChamado(chamadoId, status, atendenteId = null) {
  return new Promise((resolve, reject) => {
    let query = `UPDATE chamados SET status = ?`;
    let params = [status];

    if (atendenteId) {
      query += `, atendente_id = ?`;
      params.push(atendenteId);
    }

    if (status === 'em_atendimento') {
      query += `, iniciado_em = CURRENT_TIMESTAMP`;
    } else if (status === 'finalizado') {
      query += `, finalizado_em = CURRENT_TIMESTAMP`;
    }

    query += ` WHERE id = ?`;
    params.push(chamadoId);

    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ chamadoId, status });
    });
  });
}

// Atendente disponível
function marcarAtendente(atendenteId, status = 'livre') {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO atendentes (id, status) VALUES (?, ?)`,
      [atendenteId, status],
      function(err) {
        if (err) reject(err);
        else resolve({ atendenteId, status });
      }
    );
  });
}

// Obter atendentes
function obterAtendentes() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM atendentes`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Adicionar mensagem
function adicionarMensagem(chamadoId, texto, de) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO mensagens (chamado_id, texto, de) VALUES (?, ?, ?)`,
      [chamadoId, texto, de],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, chamadoId, texto, de });
      }
    );
  });
}

// Obter mensagens do chamado
function obterMensagens(chamadoId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM mensagens WHERE chamado_id = ? ORDER BY data ASC`,
      [chamadoId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// Adicionar manual
function adicionarManual(sistema, titulo, palavrasChave, link) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO manuais (sistema, titulo, palavras_chave, link) VALUES (?, ?, ?, ?)`,
      [sistema, titulo, palavrasChave, link],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, sistema, titulo, palavrasChave, link });
      }
    );
  });
}

// Obter todos os manuais
function obterManuais() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM manuais ORDER BY sistema, titulo`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Obter manual por ID
function obterManualPorId(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM manuais WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Obter manuais por sistema
function obterManuaisPorSistema(sistema) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM manuais WHERE LOWER(sistema) = LOWER(?) ORDER BY titulo`,
      [sistema],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// Buscar manuais por palavras-chave
function buscarManuaisPorPalavrasChave(texto) {
  return new Promise((resolve, reject) => {
    // Busca inteligente: procura se a palavra-chave está no texto
    db.all(
      `SELECT * FROM manuais WHERE 
        LOWER(titulo) LIKE LOWER(?) OR 
        LOWER(palavras_chave) LIKE LOWER(?)
        ORDER BY sistema, titulo`,
      [`%${texto}%`, `%${texto}%`],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// Atualizar manual
function atualizarManual(id, sistema, titulo, palavrasChave, link) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE manuais SET sistema = ?, titulo = ?, palavras_chave = ?, link = ? WHERE id = ?`,
      [sistema, titulo, palavrasChave, link, id],
      function(err) {
        if (err) reject(err);
        else resolve({ id, sistema, titulo, palavrasChave, link });
      }
    );
  });
}

// Deletar manual
function deletarManual(id) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM manuais WHERE id = ?`,
      [id],
      function(err) {
        if (err) reject(err);
        else resolve({ id, deletado: true });
      }
    );
  });
}

module.exports = {
  db,
  criarChamado,
  obterChamados,
  obterChamadoPorId,
  atualizarStatusChamado,
  marcarAtendente,
  obterAtendentes,
  adicionarMensagem,
  obterMensagens,
  adicionarManual,
  obterManuais,
  obterManualPorId,
  obterManuaisPorSistema,
  buscarManuaisPorPalavrasChave,
  atualizarManual,
  deletarManual
};
