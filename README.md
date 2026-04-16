# 📞 Sistema de Chamados Profissional

Sistema completo de gerenciamento de fila de chamados com chat em tempo real, métricas e integração WhatsApp.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│   🎨 Frontend (React)                    │
│   - Painel de Atendimento               │
│   - Chat em Tempo Real                  │
│   - Métricas                            │
└────────────┬────────────────────────────┘
             │ Socket.io + HTTP
┌────────────▼────────────────────────────┐
│   ⚙️ Backend (Node.js + Express)        │
│   - Fila Automática                      │
│   - Distribuição de Atendentes          │
│   - Chat                                │
│   - Métricas                            │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Instalar Dependências
```bash
npm install
cd painel && npm install && cd ..
```

### 1.1 Configurar API Key da PublicAI (backend)
No terminal onde vai iniciar o backend, defina as variáveis de ambiente:

```bash
export PUBLICAI_API_KEY="SUA_CHAVE_AQUI"
export PUBLICAI_API_URL="https://api.publicai.co" # opcional
```

> ⚠️ Nunca commitar a chave no Git. Se você já compartilhou a chave publicamente, gere outra no painel da PublicAI.

### 2. Rodar Backend (Terminal 1)
```bash
npm start
```

> O backend roda por padrão na porta `3001` (ou na porta definida em `PORT`).

### 3. Rodar Painel (Terminal 2)
```bash
cd painel && npm start
```

> Opcional: para apontar o painel para outro backend, defina `REACT_APP_API_URL` (ex.: `http://localhost:3001`).

### 4. Gerar gráficos da análise (Python)
```bash
pip install -r requirements-analise.txt
python3 gerar-graficos.py
```

## 🔧 API Endpoints

### POST `/chamado` - Criar Chamado
```bash
curl -X POST http://localhost:3001/chamado \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João",
    "telefone": "51999999999",
    "sistema": "RHID",
    "origem": "web"
  }'
```

### POST `/atendente/disponivel` - Atendente Disponível
```bash
curl -X POST http://localhost:3001/atendente/disponivel \
  -H "Content-Type: application/json" \
  -d '{"atendenteId": "atendente-1"}'
```

### POST `/finalizar` - Finalizar Atendimento
```bash
curl -X POST http://localhost:3001/finalizar \
  -H "Content-Type: application/json" \
  -d '{
    "chamadoId": "ID-DO-CHAMADO",
    "atendenteId": "atendente-1"
  }'
```

### GET `/metricas` - Obter Métricas
```bash
curl http://localhost:3001/metricas
```

### POST `/manuais/secao` - Cadastrar seção de manual
```bash
curl -X POST http://localhost:3001/manuais/secao \
  -H "Content-Type: application/json" \
  -d '{
    "sistema": "RHD",
    "etiqueta": "banco de horas",
    "titulo": "Aba de banco de horas",
    "descricao": "Configuração e consulta de banco de horas",
    "link": "https://manual.exemplo.com/rhd/banco-de-horas"
  }'
```

### POST `/manuais/sugerir` - Buscar seção ideal do manual
```bash
curl -X POST http://localhost:3001/manuais/sugerir \
  -H "Content-Type: application/json" \
  -d '{
    "sistema": "RHD",
    "etiqueta": "banco de horas",
    "texto": "como consultar saldo e fechamento"
  }'
```

### GET `/integracoes/publicai/status` - Verificar integração PublicAI
```bash
curl http://localhost:3001/integracoes/publicai/status
```

### POST `/integracoes/publicai/responder` - Resposta segura (somente após "oi")
```bash
curl -X POST http://localhost:3001/integracoes/publicai/responder \
  -H "Content-Type: application/json" \
  -d '{
    "telefone": "51999999999",
    "textoRecebido": "oi",
    "sistema": "RHD",
    "etiqueta": "banco de horas"
  }'
```

Regras de segurança implementadas:
- O sistema **não responde** até receber `oi` do cliente.
- O sistema **não posta status** no WhatsApp.

## 🧪 Teste Completo

1. Criar um chamado (curl acima)
2. Abrir `http://localhost:3000` no painel
3. Ver chamado na fila
4. Clicar para atender
5. Enviar mensagem
6. Finalizar

## 📊 Features

✅ Fila em tempo real
✅ Chat com Socket.io
✅ Distribuição automática
✅ Métricas
✅ Sugestão de manual por etiqueta/texto
✅ Regra anti-spam: só responde após "oi"
✅ Interface Zendesk-like
✅ Design responsivo

## 🔮 Roadmap

- [ ] MongoDB (persistência)
- [ ] WhatsApp Baileys
- [ ] Gráficos (Recharts)
- [ ] Autenticação
- [ ] Notificações

---

**Desenvolvido com ❤️**
