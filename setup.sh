#!/bin/bash

echo "🚀 Iniciando Sistema de Chamados..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "backend/node_modules" ]; then
    echo "${YELLOW}📦 Instalando dependências do backend...${NC}"
    cd backend
    npm install
    cd ..
fi

if [ ! -d "painel/node_modules" ]; then
    echo "${YELLOW}📦 Instalando dependências do painel...${NC}"
    cd painel
    npm install
    cd ..
fi

echo ""
echo "${GREEN}✅ Tudo pronto!${NC}"
echo ""
echo "🔧 Para rodar no DEV, abra 2 terminais:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 - Painel React:"
echo "  cd painel && npm start"
echo ""
echo "Depois acesse: http://localhost:3000"
echo ""
