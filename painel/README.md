# 🎨 Painel de Atendimento

Painel profissional estilo Zendesk para gerenciar fila de chamados em tempo real.

## 🚀 Como rodar

### Terminal 1: Backend
```bash
cd backend
npm start
```

O backend roda em: `http://localhost:3000`

### Terminal 2: Painel (React)
```bash
cd painel
npm start
```

O painel roda em: `http://localhost:3000` (React abre automaticamente)

## 📱 Funcionalidades

✅ **Fila em Tempo Real**
- Visualizar chamados aguardando
- Status: Aguardando, Em Atendimento, Finalizado
- Click para atender

✅ **Chat**
- Enviar/receber mensagens
- Histórico do chamado
- Indicador de "Digitando" (futura)

✅ **Métricas**
- Total de chamados
- Problemas na fila
- Tempo médio de atendimento
- Taxa de finalização

✅ **Design**
- Interface limpa estilo Zendesk
- Responsiva (mobile friendly)
- Atalhos de teclado (Enter para enviar)

## 🧪 Testar

### 1. Criar um chamado

```bash
curl -X POST http://localhost:3000/chamado \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telefone": "51999999999",
    "sistema": "RHID",
    "origem": "web"
  }'
```

O chamado vai aparecer na fila automaticamente!

### 2. No painel:
- Abrir `http://localhost:3000` (após rodar `npm start`)
- Clicar no chamado
- Escrever e enviar mensagem
- Finalizar quando terminar

## 📊 Estrutura do Projeto

```
painel/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js (cabeçalho roxo)
│   │   ├── Metricas.js (cartões de dados)
│   │   ├── Fila.js (lista de chamados)
│   │   └── Chat.js (interface de chat)
│   ├── App.js (componente principal)
│   ├── App.css
│   └── index.js
└── package.json
```

## 🎯 Próximos Passos

1. ✅ Painel React criado
2. ⏳ Banco MongoDB (persistência)
3. ⏳ WhatsApp Baileys (integração)
4. ⏳ Gráficos (Recharts)

---

**Desenvolvido com ❤️**
