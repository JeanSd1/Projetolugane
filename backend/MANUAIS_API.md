# 📚 API de Base de Conhecimento - Documentação

## 🎯 Visão Geral

A API de Manuais permite gerenciar uma base de conhecimento com manuais técnicos associados a diferentes sistemas. Os manuais contêm palavras-chave que são usadas para sugerir automaticamente soluções aos atendentes quando os clientes enviam mensagens.

---

## 🔌 Endpoints

### ➕ Criar novo manual
```
POST /manuais
Content-Type: application/json

{
  "sistema": "RHID",
  "titulo": "Como resetar senha",
  "palavrasChave": "senha, acesso, login, reset",
  "link": "https://docs.example.com/rhid/senha"
}
```

**Resposta (201):**
```json
{
  "id": 1,
  "sistema": "RHID",
  "titulo": "Como resetar senha",
  "palavrasChave": "senha, acesso, login, reset",
  "link": "https://docs.example.com/rhid/senha"
}
```

---

### 📖 Listar todos os manuais
```
GET /manuais
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "sistema": "RHID",
    "titulo": "Como resetar senha",
    "palavrasChave": "senha, acesso, login, reset",
    "link": "https://docs.example.com/rhid/senha",
    "criado_em": "2026-04-13 10:30:00"
  },
  {
    "id": 2,
    "sistema": "PTRP",
    "titulo": "Emitir recibos",
    "palavrasChave": "recibo, pagamento, documento",
    "link": "https://docs.example.com/ptrp/recibos",
    "criado_em": "2026-04-13 10:31:00"
  }
]
```

---

### 🔍 Buscar manuais por palavras-chave
```
GET /manuais/buscar?q=senha
```

**Parâmetros:**
- `q` (obrigatório): Termo de busca

**Resposta (200):**
```json
[
  {
    "id": 1,
    "sistema": "RHID",
    "titulo": "Como resetar senha",
    "palavrasChave": "senha, acesso, login, reset",
    "link": "https://docs.example.com/rhid/senha"
  }
]
```

**Exemplos de busca:**
- `GET /manuais/buscar?q=erro` → Encontra manuais com "erro" nas keywords
- `GET /manuais/buscar?q=sincronizar` → Encontra manuais sobre sincronização
- `GET /manuais/buscar?q=pagamento` → Encontra manuais sobre pagamentos

---

### 🏢 Obter manuais por sistema
```
GET /manuais/sistema/RHID
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "sistema": "RHID",
    "titulo": "Como resetar senha",
    "palavrasChave": "senha, acesso, login, reset",
    "link": "https://docs.example.com/rhid/senha"
  },
  {
    "id": 3,
    "sistema": "RHID",
    "titulo": "Consultar saldo de férias",
    "palavrasChave": "férias, saldo, dias",
    "link": "https://docs.example.com/rhid/ferias"
  }
]
```

**Sistemas disponíveis:**
- `RHID` - Recursos Humanos
- `PTRP` - Pagamentos
- `DMA` - Despesas
- `COMUM` - Comuns a todos

---

### 📄 Obter manual por ID
```
GET /manuais/1
```

**Resposta (200):**
```json
{
  "id": 1,
  "sistema": "RHID",
  "titulo": "Como resetar senha",
  "palavrasChave": "senha, acesso, login, reset",
  "link": "https://docs.example.com/rhid/senha",
  "criado_em": "2026-04-13 10:30:00"
}
```

**Erro (404):**
```json
{
  "erro": "Manual não encontrado"
}
```

---

### ✏️ Atualizar manual
```
PUT /manuais/1
Content-Type: application/json

{
  "sistema": "RHID",
  "titulo": "Como resetar senha (ATUALIZADO)",
  "palavrasChave": "senha, acesso, login, reset, novo",
  "link": "https://docs.example.com/rhid/senha-v2"
}
```

**Resposta (200):**
```json
{
  "id": 1,
  "sistema": "RHID",
  "titulo": "Como resetar senha (ATUALIZADO)",
  "palavrasChave": "senha, acesso, login, reset, novo",
  "link": "https://docs.example.com/rhid/senha-v2"
}
```

---

### 🗑️ Deletar manual
```
DELETE /manuais/1
```

**Resposta (200):**
```json
{
  "id": 1,
  "deletado": true
}
```

---

## 🤖 Sugestão Automática

A sugestão automática funciona em tempo real via **Socket.io**:

```
Evento: "sugestoes_manuais"
{
  "chamadoId": "abc-123",
  "manuais": [
    {
      "id": 2,
      "sistema": "RHID",
      "titulo": "Erro ao sincronizar folha de ponto",
      "palavrasChave": "sincronizar, erro, folha, ponto",
      "link": "https://..."
    }
  ]
}
```

**Fluxo:**
1. Cliente envia mensagem: "Estou com erro ao sincronizar a folha"
2. Backend detecta a mensagem via Socket.io
3. Sistema busca manuais com palavras-chave similares
4. Se encontrar, emite evento `sugestoes_manuais` para o atendente
5. Atendente recebe sugestão e pode consultar o manual

---

## 📊 Exemplos de Uso

### Exemplo 1: Adicionar um novo manual
```bash
curl -X POST http://localhost:3001/manuais \
  -H "Content-Type: application/json" \
  -d '{
    "sistema": "RHID",
    "titulo": "Resetar senha",
    "palavrasChave": "senha, login, acesso",
    "link": "https://docs.example.com/rhid/senha"
  }'
```

### Exemplo 2: Buscar por "problema de acesso"
```bash
curl http://localhost:3001/manuais/buscar?q=acesso
```

### Exemplo 3: Listar todos os manuais do RHID
```bash
curl http://localhost:3001/manuais/sistema/RHID
```

### Exemplo 4: Teste completo com Node.js
```bash
node testar-api.js
```

---

## 🚀 Popular Base de Conhecimento

Executar script para adicionar exemplos:
```bash
node popular-base.js
```

Isso vai adicionar 12 manuais de exemplo dos sistemas RHID, PTRP, DMA e COMUM.

---

## 📋 Validações

- **Sistema**: string obrigatória
- **Título**: string obrigatória
- **Palavras-chave**: string com palavras separadas por vírgula (opcional)
- **Link**: string com URL (opcional)

---

## 🎯 Casos de Uso

### ✅ Quando um cliente escreve:
> "Não consigo acessar meu saldo de férias"

O sistema:
1. Detecta palavras-chave: "férias", "saldo", "acesso"
2. Busca manuais compatíveis
3. Encontra: "Consultar saldo de férias" (RHID)
4. Envia sugestão ao atendente em tempo real

### ✅ Quando um cliente escreve:
> "Recebi desconto "errado" na folha"

O sistema:
1. Detecta: "desconto", "erro", "folha"
2. Busca similaridades
3. Encontra: "Problema com desconto indevido" (PTRP)
4. Atendente recebe sugestão

---

## 🔐 Segurança

- APIs validam campos obrigatórios
- Busca é case-insensitive
- Não há autenticação atualmente (implementar em produção)

---

## 📈 Próximas Melhorias

- [ ] Integração com IA para sugestões mais inteligentes
- [ ] Adicionar categorias aos manuais
- [ ] Ranking de popularidade
- [ ] Histórico de visualizações de manuais
- [ ] Avaliação de utilidade (útil/não útil)
- [ ] Autenticação e permissões por sistema
