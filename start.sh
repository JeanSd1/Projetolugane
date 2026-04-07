#!/bin/bash
# Script para rodar backend e painel automaticamente

echo "🚀 === INICIANDO SISTEMA DE CHAMADOS === 🚀"
echo ""

# Terminal 1 - Backend
echo "📡 Iniciando BACKEND na porta 3000..."
cd backend
npm start &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 3

# Terminal 2 - Painel
echo "🎨 Iniciando PAINEL React na porta 3001..."
cd ../painel
PORT=3001 npm start &
PAINEL_PID=$!

echo ""
echo "✅ Tudo rodando!"
echo ""
echo "🌐 Painel:  http://localhost:3000"
echo "⚙️  Backend: http://localhost:3000"
echo ""
echo "🧪 Teste: criar chamado com curl"
echo "curl -X POST http://localhost:3000/chamado -H 'Content-Type: application/json' -d '{\"nome\":\"Teste\",\"telefone\":\"51\",\"sistema\":\"RHID\",\"origem\":\"web\"}'"
echo ""
echo "📊 Métricas: curl http://localhost:3000/metricas"
echo ""
echo "Para parar, pressione Ctrl+C"
echo ""

# Aguardar interrupção
wait $BACKEND_PID
