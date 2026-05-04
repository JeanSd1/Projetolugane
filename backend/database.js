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

  // ==========================
  // 📊 TABELA HISTÓRICO DE CLIENTES
  // ==========================
  db.run(`
    CREATE TABLE IF NOT EXISTS historico_clientes (
      id TEXT PRIMARY KEY,
      telefone TEXT NOT NULL UNIQUE,
      nome_cliente TEXT,
      total_atendimentos INTEGER DEFAULT 0,
      tempo_medio_atendimento REAL DEFAULT 0,
      duvidas_frequentes TEXT,
      atendimentos_mes INTEGER DEFAULT 0,
      ultima_interacao DATETIME,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================
  // 📈 TABELA ESTATÍSTICAS DIÁRIAS
  // ==========================
  db.run(`
    CREATE TABLE IF NOT EXISTS estatisticas_diarias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telefone TEXT NOT NULL,
      data DATE NOT NULL,
      total_atendimentos INTEGER DEFAULT 0,
      tempo_total_minutos INTEGER DEFAULT 0,
      FOREIGN KEY (telefone) REFERENCES historico_clientes(telefone),
      UNIQUE(telefone, data)
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

// Finalizar chamado (atualiza status e timestamp)
function finalizarChamado(chamadoId) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE chamados SET status = 'finalizado', finalizado_em = datetime('now') WHERE id = ?`;
    db.run(sql, [chamadoId], function(err) {
      if (err) reject(err);
      else resolve({ chamadoId, status: 'finalizado' });
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

// ==========================
// 📊 FUNÇÕES DE HISTÓRICO DE CLIENTES
// ==========================

// Obter ou criar histórico de cliente
function obterOuCriarHistoricoCliente(telefone, nomeCiente) {
  return new Promise((resolve, reject) => {
    // Primeiro tenta buscar o histórico existente
    db.get(
      `SELECT * FROM historico_clientes WHERE telefone = ?`,
      [telefone],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        // Se já existe, retorna
        if (row) {
          resolve(row);
          return;
        }

        // Se não existe, cria novo
        const id = `HC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.run(
          `INSERT INTO historico_clientes (id, telefone, nome_cliente) VALUES (?, ?, ?)`,
          [id, telefone, nomeCiente],
          function(err) {
            if (err) reject(err);
            else {
              resolve({
                id,
                telefone,
                nome_cliente: nomeCiente,
                total_atendimentos: 0,
                tempo_medio_atendimento: 0,
                duvidas_frequentes: '[]',
                atendimentos_mes: 0,
              });
            }
          }
        );
      }
    );
  });
}

// Obter histórico completo do cliente
function obterHistoricoCliente(telefone) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM historico_clientes WHERE telefone = ?`,
      [telefone],
      (err, row) => {
        if (err) reject(err);
        else {
          if (row && row.duvidas_frequentes) {
            row.duvidas_frequentes = JSON.parse(row.duvidas_frequentes);
          }
          resolve(row);
        }
      }
    );
  });
}

// Atualizar histórico após finalizar chamado
function atualizarHistoricoAposFinalizacao(chamadoId) {
  return new Promise(async (resolve, reject) => {
    try {
      // Busca dados do chamado
      const chamado = await obterChamadoPorId(chamadoId);
      if (!chamado) {
        reject(new Error('Chamado não encontrado'));
        return;
      }

      // Busca ou cria histórico
      const historico = await obterOuCriarHistoricoCliente(
        chamado.telefone,
        chamado.nome_cliente
      );

      // Calcula tempo de atendimento em minutos
      const tempoAtendimento = chamado.finalizado_em && chamado.iniciado_em
        ? Math.round(
            (new Date(chamado.finalizado_em) - new Date(chamado.iniciado_em)) / 60000
          )
        : 0;

      // Busca mensagens do chamado para extrair dúvidas frequentes
      const mensagens = await obterMensagens(chamadoId);
      const textosCliente = mensagens
        .filter((m) => m.de === 'cliente')
        .map((m) => m.texto.toLowerCase());

      // Atualiza dúvidas frequentes
      let duvidasFrequentes = [];
      try {
        duvidasFrequentes = JSON.parse(historico.duvidas_frequentes || '[]');
      } catch (e) {
        duvidasFrequentes = [];
      }

      // Adiciona novas dúvidas
      textosCliente.forEach((texto) => {
        const duvida = duvidasFrequentes.find((d) => d.texto === texto);
        if (duvida) {
          duvida.frequencia += 1;
        } else {
          duvidasFrequentes.push({ texto, frequencia: 1 });
        }
      });

      // Mantém apenas as top 5 dúvidas
      duvidasFrequentes = duvidasFrequentes
        .sort((a, b) => b.frequencia - a.frequencia)
        .slice(0, 5);

      // Calcula novo tempo médio
      const novoTotal = historico.total_atendimentos + 1;
      const novoTempoMedio =
        (historico.tempo_medio_atendimento * historico.total_atendimentos +
          tempoAtendimento) /
        novoTotal;

      db.run(
        `UPDATE historico_clientes 
         SET total_atendimentos = ?,
             tempo_medio_atendimento = ?,
             duvidas_frequentes = ?,
             atendimentos_mes = atendimentos_mes + 1,
             ultima_interacao = CURRENT_TIMESTAMP,
             atualizado_em = CURRENT_TIMESTAMP
         WHERE telefone = ?`,
        [novoTotal, novoTempoMedio, JSON.stringify(duvidasFrequentes), chamado.telefone],
        function(err) {
          if (err) reject(err);
          else resolve({ sucesso: true, novoTotal, novoTempoMedio });
        }
      );

      // Registra estatística diária
      const hoje = new Date().toISOString().split('T')[0];
      db.run(
        `INSERT INTO estatisticas_diarias (telefone, data, total_atendimentos, tempo_total_minutos)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(telefone, data) DO UPDATE SET
         total_atendimentos = total_atendimentos + 1,
         tempo_total_minutos = tempo_total_minutos + ?`,
        [chamado.telefone, hoje, tempoAtendimento, tempoAtendimento],
        (err) => {
          if (err) console.error('Erro ao registrar estatística diária:', err);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

// Obter estatísticas de um mês específico
function obterEstatisticasMes(telefone, ano, mes) {
  return new Promise((resolve, reject) => {
    const mesStr = String(mes).padStart(2, '0');
    const anoStr = String(ano);
    const pattern = `${anoStr}-${mesStr}%`;

    db.all(
      `SELECT * FROM estatisticas_diarias 
       WHERE telefone = ? AND data LIKE ?
       ORDER BY data ASC`,
      [telefone, pattern],
      (err, rows) => {
        if (err) reject(err);
        else {
          const stats = {
            total_dias_com_atendimento: rows.length,
            total_atendimentos: rows.reduce((sum, r) => sum + r.total_atendimentos, 0),
            tempo_total_minutos: rows.reduce((sum, r) => sum + r.tempo_total_minutos, 0),
            dias: rows,
          };
          resolve(stats);
        }
      }
    );
  });
}

// Obter todos os clientes com histórico
function obterTodosClientes() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, telefone, nome_cliente, total_atendimentos, 
              tempo_medio_atendimento, atendimentos_mes, ultima_interacao 
       FROM historico_clientes 
       ORDER BY ultima_interacao DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// ==========================
// EXPORTAR MÓDULO
// ==========================
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
  deletarManual,
  obterOuCriarHistoricoCliente,
  obterHistoricoCliente,
  atualizarHistoricoAposFinalizacao,
  obterEstatisticasMes,
  obterTodosClientes
};
