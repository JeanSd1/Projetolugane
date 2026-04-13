const axios = require('axios');
const exemplos = require('./exemplos-manuais.json');

const API_URL = 'http://localhost:3001';

async function popularBase() {
  console.log('📚 Iniciando população da base de conhecimento...\n');

  for (let i = 0; i < exemplos.length; i++) {
    const manual = exemplos[i];
    
    try {
      const response = await axios.post(`${API_URL}/manuais`, manual);
      console.log(`✅ [${i + 1}/${exemplos.length}] Manual adicionado: "${manual.titulo}"`);
    } catch (error) {
      console.error(`❌ Erro ao adicionar manual "${manual.titulo}":`, error.message);
    }
  }

  console.log('\n✨ População concluída!');
  console.log(`📊 Total de manuais adicionados: ${exemplos.length}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  popularBase().catch(console.error);
}

module.exports = { popularBase };
