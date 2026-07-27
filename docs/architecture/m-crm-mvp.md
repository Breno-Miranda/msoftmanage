# Arquitetura Incremental — M-CRM MVP

**Status:** Ready for Dev
**Versão:** 1.0
**Data:** 2026-07-27
**Escopo inicial:** Story S021 — clientes CRM multitenant

## Estado atual e evidências

- `src/routes/catalog.ts` já publica `crm-enterprise` como produto de CRM.
- `src/models/mAppAccess.ts` associa usuário e appKey, mas não representa uma fronteira de dados organizacional.
- `src/modules/erpFinance/organizationContext.ts` resolve no servidor uma organização e unidade a partir de membership ativa.
- `src/modules/erpFinance/erpFinance.controller.ts` demonstra a ordem correta: autenticação, entitlement fixo, contexto organizacional.

## Limites de segurança

1. Identidade vem de `requireActiveUser`.
2. Entitlement é sempre a constante de servidor `crm-enterprise`; não é lido de query/body.
3. `x-organization-id` e `x-organization-unit-id` são somente uma seleção solicitada. `resolveOrganizationContext` determina a autorização final.
4. Todos os filtros, buscas, gravações e atualizações usam o `organizationId` resolvido, jamais um identificador fornecido pelo browser.
5. O bypass de administrador do `tenantPlugin` não é usado para o CRM; a política de suporte administrativo ainda não está aprovada.

## Primeiro slice

Novo módulo `src/modules/crm`:

- `crm.controller.ts`: factory de rotas com dependências injetáveis, seguindo o padrão do ERP Finance.
- `crmCustomer.model.ts`: cliente com UUID, `organizationId`, nome, e-mail, telefone, origem, status (`active`/`archived`), timestamps e índices por organização.
- `GET /crm/context`: valida a entrada autorizada no produto.
- `GET /crm/customers`: lista apenas clientes ativos da organização resolvida.
- `POST /crm/customers`: cria cliente exclusivamente na organização resolvida.

O primeiro slice não aceita `organizationId` no body e não trata unidade como filtro de dados até existir requisito de segmentação por unidade.

## Contratos

### Cabeçalhos requeridos

```text
Authorization: Bearer <token>
X-Organization-Id: <organization uuid>
X-Organization-Unit-Id: <unit uuid> (requerido somente pela política da membership)
```

### Criar cliente

```json
{
  "name": "Cliente Exemplo",
  "email": "contato@example.com",
  "phone": "+55 84 99999-9999",
  "source": "manual"
}
```

Campos de organização, appKey, proprietário e status não são aceitos do cliente.

## Dados e índices

- `mCrmCustomer`: índice `{ organizationId: 1, status: 1, createdAt: -1 }` para listagem principal.
- `mCrmCustomer`: índice único parcial `{ organizationId: 1, email: 1 }` para e-mail normalizado não vazio, evitando duplicação local sem bloquear organizações distintas.

## Erros e rollback

- 401: ausência/invalidade de identidade.
- 403: sem entitlement, membership inativa ou organização/unidade fora do escopo.
- 400: organização ausente ou payload inválido.
- 409: e-mail duplicado dentro da mesma organização.
- Rollback: desregistrar somente o módulo CRM e remover os novos modelos/rotas; não altera dados ou fluxos de ERP existentes.

## QA

Testes focados devem provar: entitlement ausente; organização ausente; membership inativa; unidade cruzada; criação com organização resolvida; listagem isolada; duplicidade somente dentro da mesma organização. Testar a factory de rotas sem MongoDB real por dependências injetadas. Revisão independente obrigatória antes de commit.
