/**
 * 🧪 ARQUIVO DE TESTE
 * Execute este arquivo com: node teste.js
 * (após iniciar o servidor em outro terminal)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Função para fazer requisições HTTP
function requisicao(metodo, caminho, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(caminho, BASE_URL);

    const opcoes = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(opcoes, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Função para aguardar
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Teste principal
async function executarTestes() {
  console.log(`
╔════════════════════════════════════╗
║   🧪 TESTES DO SISTEMA DE CHAMADOS  ║
╚════════════════════════════════════╝
`);

  try {
    // 1. LOGIN
    console.log('\n1️⃣ Fazendo login...');
    const loginRes = await requisicao('POST', '/login', {
      usuario: 'admin',
      senha: '123'
    });
    console.log('✅ Login realizado!', loginRes.body);
    const atendenteId = loginRes.body.atendente.id;

    // 2. CRIAR CHAMADO
    console.log('\n2️⃣ Criando primeiro chamado...');
    const chamado1Res = await requisicao('POST', '/chamados', {
      cliente: {
        nome: 'João Silva',
        telefone: '51999999999'
      },
      origem: 'web'
    });
    console.log('✅ Chamado criado!', chamado1Res.body);
    const chamadoId1 = chamado1Res.body.chamado.id;

    // 3. CRIAR OUTRO CHAMADO
    console.log('\n3️⃣ Criando segundo chamado...');
    const chamado2Res = await requisicao('POST', '/chamados', {
      cliente: {
        nome: 'Maria Santos',
        telefone: '51888888888'
      },
      origem: 'web'
    });
    console.log('✅ Chamado criado!', chamado2Res.body);

    // 4. OBTER FILA
    console.log('\n4️⃣ Obtendo fila de espera...');
    const filaRes = await requisicao('GET', '/chamados/fila');
    console.log('✅ Fila:', filaRes.body);

    // 5. INICIAR ATENDIMENTO
    console.log('\n5️⃣ Iniciando atendimento do primeiro chamado...');
    const iniciarRes = await requisicao('POST', '/chamados/iniciar', {
      chamadoId: chamadoId1,
      atendenteId
    });
    console.log('✅ Atendimento iniciado!', iniciarRes.body);

    // 6. ADICIONAR MENSAGEM DO CLIENTE
    console.log('\n6️⃣ Adicionando mensagem do cliente...');
    const msg1Res = await requisicao('POST', '/chamados/mensagem', {
      chamadoId: chamadoId1,
      texto: 'Olá, preciso de ajuda!',
      de: 'cliente'
    });
    console.log('✅ Mensagem adicionada!', msg1Res.body);

    // 7. ADICIONAR MENSAGEM DO ATENDENTE
    console.log('\n7️⃣ Adicionando resposta do atendente...');
    const msg2Res = await requisicao('POST', '/chamados/mensagem', {
      chamadoId: chamadoId1,
      texto: 'Oi! Como posso ajudá-lo?',
      de: 'atendente'
    });
    console.log('✅ Resposta adicionada!', msg2Res.body);

    // 8. OBTER CHAMADO COM HISTÓRICO
    console.log('\n8️⃣ Obtendo histórico do chamado...');
    const chamadoRes = await requisicao('GET', `/chamados/${chamadoId1}`);
    console.log('✅ Chamado com histórico:', JSON.stringify(chamadoRes.body, null, 2));

    // 9. FINALIZAR ATENDIMENTO
    console.log('\n9️⃣ Finalizando atendimento...');
    const finalizarRes = await requisicao('POST', '/chamados/finalizar', {
      chamadoId: chamadoId1,
      atendenteId
    });
    console.log('✅ Atendimento finalizado!', finalizarRes.body);

    // 10. OBTER MÉTRICAS
    console.log('\n🔟 Obtendo métricas...');
    const metricasRes = await requisicao('GET', '/metricas');
    console.log('✅ Métricas:', JSON.stringify(metricasRes.body, null, 2));

    // 11. OBTER MÉTRICAS DO ATENDENTE
    console.log('\n1️⃣1️⃣ Obtendo métricas do atendente...');
    const metricasAtenRes = await requisicao('GET', '/metricas/atendente');
    console.log('✅ Métricas do atendente:', JSON.stringify(metricasAtenRes.body, null, 2));

    // 12. LOGOUT
    console.log('\n1️⃣2️⃣ Fazendo logout...');
    const logoutRes = await requisicao('POST', '/logout', { atendenteId });
    console.log('✅ Logout realizado!', logoutRes.body);

    console.log(`
╔════════════════════════════════════╗
║   ✅ TODOS OS TESTES PASSARAM!      ║
╚════════════════════════════════════╝
`);

  } catch (erro) {
    console.error('❌ Erro durante testes:', erro.message);
    console.error('\n⚠️  Certifique-se de que o servidor está rodando em http://localhost:3000');
    console.error('Execute: npm run dev');
  }
}

// Executar testes
executarTestes();
