# 📞 Sistema de Chamados

Sistema completo de gerenciamento de fila de chamados com suporte a WebSocket, métricas em tempo real e integração com WhatsApp.

## 🚀 Começar

### Instalação

```bash
npm install
```

### Desenvolver

```bash
npm run dev
```

### Produção

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

---

## 📚 Estrutura do Projeto

```
src/
├── models/          # Modelos de dados e banco em memória
│   ├── Chamado.js   # Classes Chamado e Atendente
│   └── database.js  # Simulação de banco de dados
├── controllers/     # Lógica de negócio
│   ├── chamadosController.js
│   ├── metricasController.js
│   └── autenticacaoController.js
├── routes/          # Rotas da API
│   └── index.js
├── sockets/         # WebSocket em tempo real
│   └── chat.js
└── server.js        # Arquivo principal
```

---

## 🔌 API Endpoints

### Autenticação

```bash
# Login
POST /api/login
Content-Type: application/json

{
  "usuario": "admin",
  "senha": "123"
}

# Logout
POST /api/logout
Content-Type: application/json

{
  "atendenteId": "id-do-atendente"
}

# Registrar novo atendente
POST /api/registrar
{
  "usuario": "novo_usuario",
  "senha": "senha123",
  "nome": "Nome do Atendente"
}

# Listar atendentes
GET /api/atendentes
```

### Chamados

```bash
# Criar chamado
POST /api/chamados
Content-Type: application/json

{
  "cliente": {
    "nome": "João",
    "telefone": "519999999"
  },
  "origem": "web"  # web ou whatsapp
}

# Obter todos os chamados
GET /api/chamados

# Obter fila de espera
GET /api/chamados/fila

# Obter chamado por ID
GET /api/chamados/{id}

# Iniciar atendimento
POST /api/chamados/iniciar
{
  "chamadoId": "id-do-chamado",
  "atendenteId": "id-do-atendente"
}

# Finalizar atendimento
POST /api/chamados/finalizar
{
  "chamadoId": "id-do-chamado",
  "atendenteId": "id-do-atendente"
}

# Adicionar mensagem
POST /api/chamados/mensagem
{
  "chamadoId": "id-do-chamado",
  "texto": "Mensagem aqui",
  "de": "cliente"  # cliente ou atendente
}

# Histórico de chamados do atendente
GET /api/chamados/atendente/{atendenteId}
```

### Métricas

```bash
# Métricas gerais
GET /api/metricas

# Métricas por atendente
GET /api/metricas/atendente

# Saúde do sistema
GET /api/metricas/saude
```

### Limpeza

```bash
# Limpar dados (teste)
DELETE /api/dados
```

---

## 🔌 WebSocket Events

### Cliente se conectando

```javascript
// Entrar em uma sala de chamado
socket.emit('entrar_chamado', 'id-do-chamado');

// Sair de uma sala
socket.emit('sair_chamado', 'id-do-chamado');

// Enviar mensagem
socket.emit('enviar_mensagem', {
  chamadoId: 'id-do-chamado',
  texto: 'Olá!',
  de: 'cliente' // ou 'atendente'
});

// Indicador de digitação
socket.emit('digitando', {
  chamadoId: 'id-do-chamado',
  usuario: 'João'
});

// Parou de digitar
socket.emit('parou_digitando', 'id-do-chamado');

// Observar fila em tempo real
socket.emit('observar_fila');
```

### Servidor emitindo

```javascript
// Histórico de mensagens
socket.on('historico_mensagens', (mensagens) => {
  console.log(mensagens);
});

// Nova mensagem
socket.on('nova_mensagem', (mensagem) => {
  console.log('Nova mensagem:', mensagem);
});

// Usuário digitando
socket.on('usuario_digitando', (data) => {
  console.log(data.usuario, 'está digitando');
});

// Fila atualizada
socket.on('atualizar_fila', (fila) => {
  console.log('Tamanho da fila:', fila.tamanho);
});

// Status atualizado
socket.on('status_atualizado', (novoStatus) => {
  console.log('Status:', novoStatus);
});
```

---

## 📊 Estrutura de Dados

### Chamado

```javascript
{
  id: "uuid",
  cliente: {
    nome: "João",
    telefone: "519999999"
  },
  origem: "web", // web | whatsapp
  status: "aguardando", // aguardando | em_atendimento | finalizado
  atendenteId: null,
  criadoEm: Date,
  iniciadoEm: null,
  finalizadoEm: null,
  prioridade: 1, // 1 = normal, 2 = alta, 3 = urgente
  mensagens: [
    {
      id: "uuid",
      texto: "Oi",
      de: "cliente", // cliente | atendente
      data: Date
    }
  ]
}
```

### Atendente

```javascript
{
  id: "uuid",
  usuario: "admin",
  senha: "123",
  nome: "Administrador",
  ativo: false,
  chamadoAtual: null,
  chamadosAtendidos: 0,
  criado_em: Date
}
```

### Métricas

```javascript
{
  total: 10,
  finalizados: 5,
  ativos: 2,
  aguardando: 3,
  tempoMedioAtendimento: "12.50", // minutos
  tempoMedioEspera: "2.30", // minutos
  porOrigem: {
    web: 7,
    whatsapp: 3
  },
  taxaFinalizacao: "50.00" // percentual
}
```

---

## 🧪 Testar com cURL

```bash
# 1. Criar chamado
curl -X POST http://localhost:3000/api/chamados \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": {"nome": "João", "telefone": "519999999"},
    "origem": "web"
  }'

# 2. Obter fila
curl http://localhost:3000/api/chamados/fila

# 3. Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "senha": "123"
  }'

# 4. Iniciar atendimento
curl -X POST http://localhost:3000/api/chamados/iniciar \
  -H "Content-Type: application/json" \
  -d '{
    "chamadoId": "ID-DO-CHAMADO",
    "atendenteId": "ID-DO-ATENDENTE"
  }'

# 5. Métricas
curl http://localhost:3000/api/metricas
```

---

## 🔮 Próximas Etapas

- [ ] Integração com WhatsApp (Baileys)
- [ ] Banco de dados (PostgreSQL)
- [ ] Dashboard Frontend (React)
- [ ] Autenticação JWT
- [ ] Persistência de dados
- [ ] Notificações por email
- [ ] Relatórios avançados

---

## 📝 Notas

- Atualmente os dados são armazenados em memória (não persistem após reiniciar)
- Usuário padrão: `admin` / `123`
- Para produção, integrar com banco de dados real

---

**Desenvolvido com ❤️**
