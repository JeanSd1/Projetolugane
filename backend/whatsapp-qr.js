const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client();
const BACKEND_URL = 'http://localhost:3001';

// Armazenar contatos para criar chamados
const contatos = {};

client.on('qr', (qr) => {
  console.log('\n📱 QR Code gerado! Escaneie com seu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n✅ Escaneie o código acima para autenticar.\n');
});

client.on('ready', () => {
  console.log('✅ Cliente WhatsApp conectado com sucesso!');
  console.log('🚀 WhatsApp Web já está pronto para usar');
});

client.on('message', async (message) => {
  try {
    const chat = await message.getChat();
    const contact = await message.getContact();
    const nome = contact.name || contact.number;
    const telefone = contact.number;
    const texto = message.body;

    console.log(`\n📨 Nova mensagem de ${nome}: ${texto}`);

    // Criar chamado no backend
    const response = await axios.post(`${BACKEND_URL}/chamado`, {
      nome,
      telefone,
      sistema: 'whatsapp',
      origem: 'whatsapp',
      mensagem: texto
    });

    console.log('✅ Chamado criado:', response.data.id);

    // Armazenar para referência
    contatos[telefone] = { nome, chatId: chat.id, chamadoId: response.data.id };

  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err.message);
  }
});

client.on('auth_failure', () => {
  console.log('❌ Falha na autenticação. Tente novamente.');
  process.exit(1);
});

client.on('disconnected', (reason) => {
  console.log('🔌 Cliente desconectado:', reason);
});

client.initialize();

// Tratamento para evitar travamento
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando conexão...');
  client.destroy();
  process.exit(0);
});
