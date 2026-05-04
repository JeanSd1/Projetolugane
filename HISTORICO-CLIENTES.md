# 📊 Sistema de Histórico Automático de Clientes

## O que foi implementado

O sistema agora captura **automaticamente** todas as informações dos clientes através do WhatsApp:

### ✅ Dados Capturados

1. **Total de Atendimentos**
   - Conta automaticamente quantas vezes o cliente foi atendido
   - Atualiza cada vez que um chamado é finalizado

2. **Tempo Médio de Atendimento**
   - Calcula automaticamente o tempo entre início e fim do atendimento
   - Armazena e calcula a média de todos os atendimentos

3. **Dúvidas Frequentes**
   - Extrai as 5 dúvidas mais frequentes das mensagens do cliente
   - Conta quantas vezes cada dúvida apareceu
   - Exibe em ordem de frequência

4. **Estatísticas por Dia/Mês**
   - Registra número de atendimentos por dia
   - Tempo total gasto por dia
   - Gera gráficos interativos
   - Permite visualizar dados de qualquer mês

5. **Relatórios em PDF**
   - Gera PDF mensal automaticamente
   - Contém todos os dados consolidados
   - Permite download/impressão

## 🔧 Como Funciona o Fluxo

```
WhatsApp → Backend (whatsapp-qr.js) → Criar/Atualizar Chamado
                                     ↓
                              Armazenar Mensagens
                                     ↓
                         (Quando chamado é finalizado)
                                     ↓
         Backend calcula histórico:
         • Contagem de atendimentos
         • Tempo de atendimento
         • Extrai dúvidas frequentes
         • Registra estatísticas do dia
                                     ↓
                        Atualiza tabela histórico_clientes
                        Atualiza tabela estatisticas_diarias
```

## 📱 Como Acessar no Painel

### 1. **Ver Histórico de Todos os Clientes**
   - Clique no botão "📊 Histórico de Clientes" (canto inferior direito)
   - Veja lista de todos os clientes
   - Busque por nome ou telefone

### 2. **Ver Detalhes de Um Cliente**
   - Clique em "Ver Histórico" na tabela de clientes
   - Veja resumo: total de atendimentos, tempo médio, etc.

### 3. **Visualizar Gráficos**
   - Na aba "📈 Gráficos"
   - Veja atendimentos por dia
   - Tempo total gasto por dia
   - Navegue entre meses

### 4. **Ver Dúvidas Frequentes**
   - Na aba "❓ Dúvidas Frequentes"
   - Veja quais perguntas o cliente mais costuma fazer

### 5. **Gerar Relatório em PDF**
   - Clique em "📄 Gerar PDF"
   - Download automático do relátório mensal
   - Pode imprimir ou arquivar

## 🗄️ Banco de Dados

### Novas Tabelas Criadas

#### `historico_clientes`
```sql
- id: ID único
- telefone: Número do WhatsApp (chave única)
- nome_cliente: Nome da pessoa
- total_atendimentos: Contador
- tempo_medio_atendimento: Em minutos
- duvidas_frequentes: JSON com dúvidas e frequência
- atendimentos_mes: Contador do mês atual
- ultima_interacao: Data/hora da última mensagem
- criado_em: Quando foi criado
- atualizado_em: Última atualização
```

#### `estatisticas_diarias`
```sql
- id: ID único
- telefone: Referência ao cliente
- data: Data (YYYY-MM-DD)
- total_atendimentos: Atendimentos do dia
- tempo_total_minutos: Tempo total gasto
```

## 🔄 Integração com WhatsApp

Quando você conectar o WhatsApp:

1. **Mensagem chega no WhatsApp Web**
   ↓
2. **whatsapp-qr.js recebe a mensagem**
   ↓
3. **Cria/Atualiza um chamado no backend**
   ↓
4. **Todas as mensagens são armazenadas**
   ↓
5. **Quando o atendimento termina (finalizar)**
   ↓
6. **Sistema processa e calcula:**
   - Identifica dúvidas do cliente
   - Calcula tempo de atendimento
   - Incrementa contadores
   - Registra estatísticas do dia

## 📋 API Endpoints

### Histórico
```
GET  /historico               → Lista todos os clientes
GET  /historico/:telefone     → Detalhes de um cliente
GET  /historico/:telefone/mes/:ano/:mes → Estatísticas do mês
POST /historico/atualizar/:chamadoId    → Atualiza após finalizar
```

### PDF
```
POST /gerar-relatorio-pdf/:telefone/:ano/:mes  → Gera o PDF
GET  /download-relatorio/:telefone/:ano/:mes   → Faz download
```

## 🚀 Instalação de Dependências

```bash
# Na pasta do projeto
npm install

# Isso instalará, inclusive, o pdfkit para gerar PDFs
```

## 📦 Dependências Adicionadas

- **pdfkit** (^0.13.0) - Para gerar relatórios em PDF

## 💡 Exemplos de Uso

### Exemplo 1: Cliente que enviou "Olá, como faço para resetar minha senha?"
- Click em histórico
- Busca por nome/telefone
- Vê que a dúvida mais frequente é "como faço para resetar minha senha"
- Clica em "Gerar PDF" para ter um relatório mensal incluindo essa dúvida

### Exemplo 2: Analisar tempo de atendimento
- Entra no histórico de um cliente
- Vê tempo médio de atendimento
- Clica em "Gráficos" para ver:
  - Quantos atendimentos por dia
  - Tempo total gasto por dia
  - Pode comparar diferentes meses

### Exemplo 3: Gerar relatório para o cliente
- Seleciona o mês desejido (navegadores com setas ← →)
- Clica "Gerar PDF"
- Arquivo é baixado automaticamente
- Envia para o cliente ou imprime

## 🔐 Dados Armazenados de Forma Segura

Todos os dados são armazenados localmente no SQLite:
- `sistema_atendimento.db` (banco de dados local)
- `/relatorios-pdf/` (PDFs salvos localmente)

## 📊 Próximas Melhorias Possíveis

- [ ] Exportar para Excel
- [ ] Gráficos comparativos entre meses
- [ ] Alertas de padrões de atendimento
- [ ] Integração com email para enviar PDFs
- [ ] Dashboard com análise de todos os clientes
