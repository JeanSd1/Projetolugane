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
cd backend && npm install && cd ..
cd painel && npm install && cd ..
```

### 2. Rodar Backend (Terminal 1)
```bash
cd backend && npm start
```

### 3. Rodar Painel (Terminal 2)
```bash
cd painel && npm start
```

## 🔧 API Endpoints

### POST `/chamado` - Criar Chamado
```bash
curl -X POST http://localhost:3000/chamado \
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
curl -X POST http://localhost:3000/atendente/disponivel \
  -H "Content-Type: application/json" \
  -d '{"atendenteId": "atendente-1"}'
```

### POST `/finalizar` - Finalizar Atendimento
```bash
curl -X POST http://localhost:3000/finalizar \
  -H "Content-Type: application/json" \
  -d '{
    "chamadoId": "ID-DO-CHAMADO",
    "atendenteId": "atendente-1"
  }'
```

### GET `/metricas` - Obter Métricas
```bash
curl http://localhost:3000/metricas
```

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