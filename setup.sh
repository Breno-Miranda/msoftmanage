#!/bin/bash

# Script de setup automático para o projeto Bun + MongoDB

echo "🚀 Iniciando setup do projeto Bun + MongoDB..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se o Bun está instalado
echo "📦 Verificando instalação do Bun..."
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}⚠️  Bun não encontrado. Instalando...${NC}"
    curl -fsSL https://bun.sh/install | bash
    
    # Adiciona ao PATH
    export PATH="$HOME/.bun/bin:$PATH"
    
    echo -e "${GREEN}✅ Bun instalado com sucesso!${NC}"
else
    echo -e "${GREEN}✅ Bun já está instalado: $(bun --version)${NC}"
fi

echo ""

# Instala as dependências
echo "📦 Instalando dependências..."
bun install

echo ""

# Verifica se o MongoDB está rodando
echo "🔍 Verificando MongoDB..."
if ! docker ps | grep -q mongo-bun; then
    echo -e "${YELLOW}⚠️  MongoDB não está rodando. Iniciando container...${NC}"
    
    # Verifica se o container existe mas está parado
    if docker ps -a | grep -q mongo-bun; then
        docker start mongo-bun
        echo -e "${GREEN}✅ Container MongoDB iniciado!${NC}"
    else
        # Cria novo container
        docker run -d --name mongo-bun -p 27017:27017 mongo
        echo -e "${GREEN}✅ Container MongoDB criado e iniciado!${NC}"
    fi
else
    echo -e "${GREEN}✅ MongoDB já está rodando!${NC}"
fi

echo ""

# Verifica se o .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado!${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env já existe!${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup concluído com sucesso!${NC}"
echo ""
echo "Para iniciar o servidor em modo desenvolvimento, execute:"
echo -e "${YELLOW}bun run dev${NC}"
echo ""
echo "A API estará disponível em: http://localhost:3000"
echo ""
