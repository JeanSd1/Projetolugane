const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testarAPI() {
  console.log('🧪 Iniciando testes da API de Manuais\n');
  
  try {
    // 1️⃣ Testar criação de manual
    console.log('1️⃣ Testando criação de manual...');
    const novoManual = {
      sistema: 'TESTE',
      titulo: 'Manual de Teste',
      palavrasChave: 'teste, validação, exemplo',
      link: 'https://example.com/teste'
    };
    
    const criacaoRes = await axios.post(`${API_URL}/manuais`, novoManual);
    console.log('✅ Manual criado:', criacaoRes.data);
    const manualId = criacaoRes.data.id;
    
    // 2️⃣ Testar listagem
    console.log('\n2️⃣ Testando listagem de manuais...');
    const listaRes = await axios.get(`${API_URL}/manuais`);
    console.log(`✅ Total de manuais na base: ${listaRes.data.length}`);
    
    // 3️⃣ Testar busca por palavra-chave
    console.log('\n3️⃣ Testando busca por palavra-chave "senha"...');
    const buscaRes = await axios.get(`${API_URL}/manuais/buscar?q=senha`);
    console.log(`✅ Manuais encontrados: ${buscaRes.data.length}`);
    if (buscaRes.data.length > 0) {
      console.log('   Primeiro resultado:', buscaRes.data[0].titulo);
    }
    
    // 4️⃣ Testar busca por sistema
    console.log('\n4️⃣ Testando busca por sistema (RHID)...');
    const sistemaRes = await axios.get(`${API_URL}/manuais/sistema/RHID`);
    console.log(`✅ Manuais do RHID: ${sistemaRes.data.length}`);
    
    // 5️⃣ Testar obtenção de manual por ID
    console.log(`\n5️⃣ Testando obtenção de manual por ID (${manualId})...`);
    const idRes = await axios.get(`${API_URL}/manuais/${manualId}`);
    console.log(`✅ Manual recuperado: ${idRes.data.titulo}`);
    
    // 6️⃣ Testar atualização
    console.log(`\n6️⃣ Testando atualização de manual...`);
    const updateRes = await axios.put(`${API_URL}/manuais/${manualId}`, {
      sistema: 'TESTE',
      titulo: 'Manual de Teste Atualizado',
      palavrasChave: 'teste, atualizado, exemplo, validação',
      link: 'https://example.com/teste-updated'
    });
    console.log(`✅ Manual atualizado: ${updateRes.data.titulo}`);
    
    // 7️⃣ Testar sugestão automática
    console.log('\n7️⃣ Testando sugestão automática (buscar "erro ao sincronizar")...');
    const sugestaoRes = await axios.get(`${API_URL}/manuais/buscar?q=erro ao sincronizar`);
    console.log(`✅ Manuais sugeridos: ${sugestaoRes.data.length}`);
    if (sugestaoRes.data.length > 0) {
      sugestaoRes.data.forEach(m => {
        console.log(`   • [${m.sistema}] ${m.titulo}`);
      });
    }
    
    // 8️⃣ Testar deleção
    console.log(`\n8️⃣ Testando deleção de manual...`);
    const delRes = await axios.delete(`${API_URL}/manuais/${manualId}`);
    console.log(`✅ Manual deletado:`, delRes.data);
    
    console.log('\n\n✨ ✨ TODOS OS TESTES PASSARAM! ✨ ✨');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testarAPI().catch(console.error);
}

module.exports = { testarAPI };
