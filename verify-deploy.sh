#!/bin/bash

# 🚀 Script de Verificação de Deploy - msoftmanage API
# Este script testa todos os endpoints da API para garantir que está funcionando corretamente

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
API_URL="${1:-http://localhost:3000}"
VERBOSE="${2:-false}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     msoftmanage API - Verificação de Deploy         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🌐 URL da API: ${API_URL}${NC}"
echo ""

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[Teste $TOTAL_TESTS]${NC} $description"
    echo -e "  ${YELLOW}→${NC} $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✓${NC} Status: $http_code (esperado: $expected_status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        if [ "$VERBOSE" = "true" ]; then
            echo -e "  ${YELLOW}Resposta:${NC}"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
    else
        echo -e "  ${RED}✗${NC} Status: $http_code (esperado: $expected_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "  ${RED}Resposta:${NC}"
        echo "$body"
    fi
    
    echo ""
}

# Função para verificar se a API está online
check_api_online() {
    echo -e "${YELLOW}🔍 Verificando se a API está online...${NC}"
    
    if curl -s --connect-timeout 5 "$API_URL" > /dev/null; then
        echo -e "${GREEN}✓ API está respondendo!${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ API não está respondendo!${NC}"
        echo -e "${RED}  Verifique se a API está rodando em: $API_URL${NC}"
        echo ""
        exit 1
    fi
}

# Função para verificar dependências
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}✗ curl não está instalado!${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠ jq não está instalado (opcional, mas recomendado para melhor visualização)${NC}"
        echo -e "${YELLOW}  Instale com: brew install jq (macOS) ou apt install jq (Linux)${NC}"
        echo ""
    fi
}

# Início dos testes
check_dependencies
check_api_online

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TESTES DE ENDPOINTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# 1. Teste de Health Check Básico
test_endpoint "GET" "/" 200 "Health Check Básico"

# 2. Teste de Health Check Detalhado
test_endpoint "GET" "/health" 200 "Health Check Detalhado (MongoDB)"

# 3. Teste de Documentação
test_endpoint "GET" "/docs" 200 "Documentação da API"

# 4. Teste de Listagem de Produtos (pode estar vazio)
test_endpoint "GET" "/products" 200 "Listar Produtos"

# 5. Teste de Criação de Produto
PRODUCT_DATA='{
  "name": "Produto Teste",
  "description": "Produto criado pelo script de teste",
  "price": 99.90,
  "stock": 100,
  "category": "Teste",
  "active": true
}'
test_endpoint "POST" "/products" 201 "Criar Produto" "$PRODUCT_DATA"

# 6. Teste de Busca de Produto Inexistente (deve retornar 404)
test_endpoint "GET" "/products/000000000000000000000000" 404 "Buscar Produto Inexistente"

# Resumo dos testes
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  RESUMO DOS TESTES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total de testes: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Testes passados: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Testes falhados: ${RED}$FAILED_TESTS${NC}"
echo ""

# Verificação de saúde do MongoDB
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VERIFICAÇÃO DO MONGODB${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

health_response=$(curl -s "$API_URL/health")
db_connected=$(echo "$health_response" | jq -r '.database.connected' 2>/dev/null)

if [ "$db_connected" = "true" ]; then
    echo -e "${GREEN}✓ MongoDB está conectado!${NC}"
    
    db_host=$(echo "$health_response" | jq -r '.database.host' 2>/dev/null)
    db_name=$(echo "$health_response" | jq -r '.database.database' 2>/dev/null)
    
    echo -e "  Host: ${YELLOW}$db_host${NC}"
    echo -e "  Database: ${YELLOW}$db_name${NC}"
else
    echo -e "${RED}✗ MongoDB NÃO está conectado!${NC}"
    echo -e "${RED}  Verifique a variável MONGODB_URI${NC}"
fi

echo ""

# Status final
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STATUS FINAL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ] && [ "$db_connected" = "true" ]; then
    echo -e "${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}✓ API está funcionando corretamente em produção!${NC}"
    exit 0
elif [ $FAILED_TESTS -eq 0 ] && [ "$db_connected" != "true" ]; then
    echo -e "${YELLOW}⚠ Testes passaram, mas MongoDB não está conectado${NC}"
    echo -e "${YELLOW}  Configure a variável MONGODB_URI${NC}"
    exit 1
else
    echo -e "${RED}✗ ALGUNS TESTES FALHARAM!${NC}"
    echo -e "${RED}  Verifique os logs acima para mais detalhes${NC}"
    exit 1
fi
