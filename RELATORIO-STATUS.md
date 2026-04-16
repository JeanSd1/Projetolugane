# Relatório de Status Técnico

_Data: 2026-04-16_

## 1) Visão geral

O projeto está **próximo do funcional**, mas ainda existem pendências de ambiente e consistência entre módulos que impedem uma execução limpa de ponta a ponta sem ajustes manuais.

## 2) O que está ok

- Backend compila sintaticamente (`node --check backend/server.js`).
- Script de gráficos compila (`python3 -m py_compile gerar-graficos.py`).
- Painel já usa `REACT_APP_API_URL` com fallback para `http://localhost:3001` no código.

## 3) Pendências encontradas

### 3.1 Crítico — falta `backend/package.json`

- O repositório não possui `backend/package.json`.
- Com isso, comandos como `npm --prefix backend run start` e `npm --prefix backend install` falham por `ENOENT`.
- Hoje, as dependências do backend estão no `package.json` da raiz.

**Impacto:** a documentação/rotina de execução pode confundir e quebrar onboarding.

### 3.2 Importante — build do painel depende de instalação prévia

- `npm --prefix painel run build` falha quando `react-scripts` não está instalado.
- Isso é esperado sem `npm install`, mas vale formalizar no checklist de setup.

**Impacto:** pipeline local falha se setup não for seguido à risca.

### 3.3 Importante — base de manuais duplicada (in-memory + SQLite)

- Existem rotas de manuais em memória (`/manuais/secao`, `/manuais/sugerir`) e também CRUD persistente em SQLite (`/manuais`, `/manuais/:id`, etc.).
- Os dois fluxos não compartilham a mesma fonte de verdade.

**Impacto:** inconsistência de dados e comportamento difícil de prever.

## 4) Gráficos (status)

- O script está preparado para gerar em `graficos-analise/`.
- Se bibliotecas Python faltarem, ele já informa para instalar `requirements-analise.txt`.

**Ação para operar:**

```bash
pip install -r requirements-analise.txt
python3 gerar-graficos.py
```

## 5) Recomendações objetivas (prioridade)

1. **Definir padrão de execução do backend**:
   - Opção A: manter backend na raiz (e ajustar docs/scripts para isso);
   - Opção B: criar `backend/package.json` e mover scripts/deps para lá.
2. **Unificar manuais** em uma única fonte de dados (preferencialmente SQLite).
3. **Adicionar checklist de setup** no README:
   - `npm install` (raiz),
   - `npm --prefix painel install`,
   - `pip install -r requirements-analise.txt`.
4. **Adicionar testes mínimos de fumaça** para endpoints principais (`/chamado`, `/metricas`, `/finalizar`).

## 6) Conclusão

Hoje o projeto está com boa base, mas ainda com lacunas de empacotamento e consistência de dados.
Com os 3 primeiros ajustes acima, você já elimina a maior parte dos erros de execução/ambiente.
