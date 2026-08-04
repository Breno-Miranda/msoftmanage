# S021 — Formulário público de cliente via broker

**Status:** Em elaboração — contrato técnico inicial
**Data:** 2026-08-03
**Escopo:** `m-gateway`, `m-manage` e o formulário de consulta da Padrão Engenharia.

## Objetivo

Receber uma solicitação pública em `POST https://gateway.mirandasoft.com.br/client/form/:source`, publicar um evento de formulário no destino RabbitMQ `msoft-form-client` e permitir que o `m-manage` processe o evento sem expor o broker ao navegador.

O segmento `:source` é metadado controlado pelo servidor. Para a primeira integração, o valor pretendido é `padrao-engenharia`; ele deve acompanhar o evento e o lead persistido para filtragem e assinatura.

## Evidências atuais

- O `m-gateway` já possui Elysia, conexão AMQP encapsulada em `src/rabbit.ts`, allow-list de filas e testes com adaptador Rabbit injetável.
- O proxy atual do gateway usa `MANAGE_API_URL`, com padrão `https://api.mirandasoft.com.br`.
- O `m-manage` já registra `mLeadsRequestRoutes` em `src/index.ts` e tem o modelo `mLead`, cujo contrato atual exige `name`, `email`, `phone`, `service` e `message`.
- O formulário de Padrão Engenharia atualmente coleta `name`, `email`, `phone`, `message` e `consent`; ainda apresenta corretamente o estado de canal não configurado.
- O `m-manage` ainda não possui cliente ou consumidor AMQP e a dependência `amqplib` ainda não faz parte de seu manifesto.

## Contrato de evento proposto — versão 1

O gateway valida a entrada pública e produz somente o envelope abaixo. O campo `source` vem exclusivamente de `:source`; o corpo não pode substituí-lo.

```json
{
  "eventId": "UUID",
  "eventType": "client.form.submitted",
  "eventVersion": 1,
  "occurredAt": "ISO-8601 UTC",
  "source": "padrao-engenharia",
  "lead": {
    "name": "Nome do contato",
    "email": "email@example.com",
    "phone": "+55...",
    "message": "Descrição da necessidade"
  },
  "consent": {
    "granted": true,
    "textVersion": "public-client-form-v1"
  },
  "attribution": {
    "landingPath": "/padrao-engenharia/consultar",
    "utmSource": "optional",
    "utmMedium": "optional",
    "utmCampaign": "optional"
  }
}
```

Campos de atribuição são opcionais, têm limite de tamanho e são dados não confiáveis. Não incluir IP bruto, `User-Agent` completo, cookies, tokens, senha, dados de pagamento ou outros dados não necessários para retorno ao contato.

## Rotas propostas

| Serviço | Rota | Acesso | Comportamento |
|---|---|---|---|
| m-gateway | `POST /client/form/:source` | Público, sujeito a origem permitida e limitação antiabuso | Valida formulário e consentimento, monta envelope v1 e publica de forma persistente em `msoft-form-client`. Retorna apenas um identificador de solicitação. |
| m-manage | consumidor interno de `msoft-form-client` | Somente processo de infraestrutura | Valida o envelope, aplica idempotência por `eventId`, persiste o lead com `source` e confirma a mensagem somente após persistência. |
| m-manage | rota administrativa de leads | Autenticada | Consulta dados já persistidos; não deve expor a fila nem mensagens brutas a clientes públicos. |

A rota pública não acessa `POST /leads` diretamente e não recebe URI ou credenciais do RabbitMQ.

## Segurança e privacidade

1. O broker deve ser acessível somente na rede de serviços; URI e credenciais são variáveis de deploy, nunca versionadas.
2. O gateway aceita somente fontes em `FORM_CLIENT_ALLOWED_SOURCES`. A primeira allow-list deve conter `padrao-engenharia`.
3. O gateway deve limitar tamanho, validar formato e aplicar proteção antiabuso antes de abrir conexão AMQP. Limitação distribuída/WAF é requisito de infraestrutura; uma limitação apenas em memória não protege múltiplas réplicas.
4. O consentimento explícito é obrigatório. A política de base legal, retenção, atendimento de revogação e destinatário operacional permanece pendente de definição de negócio.
5. O consumidor não deve registrar PII no log. Respostas públicas e erros de broker devem ser genéricos.
6. A fila deve ser durável. A política de retry, TTL, DLQ e alertas ainda precisa ser aprovada antes de produção.

## Decisões e gates pendentes

| Gate | Necessidade | Impacto |
|---|---|---|
| Topologia RabbitMQ | Confirmar se `msoft-form-client` é fila direta ou binding em exchange topic, além de vhost e permissões de serviço. | Define publish/consume real e DLQ. |
| Consumidor m-manage | Confirmar que o `m-manage` será o consumidor persistente, em vez de outro worker. | Define ciclo de vida e deploy do processo. |
| Dados comerciais | Confirmar se `service`, `company` e `budget` são obrigatórios para o modelo legado ou se o modelo deve aceitar o formulário Padrão atual. | Evita inventar dados para persistência. |
| LGPD | Definir responsável, prazo de retenção, canal de revogação e texto/versionamento final do consentimento. | Necessário antes de ativar captação em produção. |
| Antiabuso | Definir WAF/rate limit distribuído e domínio/origens do frontend que poderão chamar a rota. | Necessário antes de expor endpoint público. |

## Implementação em fases

1. **Fase técnica atual:** adicionar contrato compartilhado, rota pública fechada por allow-list/configuração, publicação persistente e testes sem broker real.
2. **Fase de consumo:** adicionar consumidor interno no `m-manage`, armazenamento idempotente e teste com adaptador AMQP falso.
3. **Ativação do site:** somente após os gates de LGPD, domínio/CORS, antiabuso e configuração de broker; trocar o estado indisponível do formulário por integração real.

## Verificação e rollback

- Testar entrada válida, fonte não autorizada, falta de consentimento, campos inválidos, payload grande, broker indisponível e duplicação de `eventId`.
- Verificar que nenhuma resposta ou log contém URI AMQP ou PII além do mínimo operacional.
- Rollback: desabilitar `FORM_CLIENT_ALLOWED_SOURCES` ou remover a rota do deploy; mensagens duráveis já publicadas permanecem na fila até decisão operacional.
