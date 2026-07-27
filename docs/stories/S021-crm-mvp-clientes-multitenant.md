# S021 — M-CRM MVP: Clientes multitenant

**Status:** Ready for Release
**Épico:** M-CRM MVP
**Prioridade:** Alta
**Data:** 2026-07-27

## História

Como vendedor de uma organização autorizada, quero cadastrar e consultar meus clientes para registrar o contexto comercial sem acessar dados de outras organizações.

## Critérios de aceite

1. `crm-enterprise` é uma constante de servidor para as rotas CRM; `appKey` do body/query não pode alterar a autorização.
2. `GET /crm/context` exige identidade, entitlement e contexto de organização resolvido.
3. `GET /crm/customers` retorna apenas registros `active` da organização resolvida.
4. `POST /crm/customers` cria um registro somente com o `organizationId` resolvido no servidor.
5. A API rejeita seleção sem organização, membership inativa, unidade de outra organização, entitlement ausente e e-mail duplicado na mesma organização.
6. O mesmo e-mail pode existir em organizações diferentes.
7. Não há conexão MongoDB real nos testes de autorização; dependências são injetadas.
8. O módulo é registrado em `src/app.ts` e usa respostas `{ success, data/error }` do projeto.

## Tarefas

- [x] Criar modelo de cliente e índices organizacionais.
- [x] Criar factory de rotas CRM com contexto e dependências injetáveis.
- [x] Registrar o módulo na aplicação.
- [x] Escrever testes RED para autorização, isolamento e duplicidade.
- [x] Executar testes focados, build e revisão independente.

## Arquivos previstos

- `src/models/mCrmCustomer.ts`
- `src/modules/crm/index.ts`
- `src/modules/crm/crm.controller.ts`
- `src/app.ts`
- `tests/crm-context.test.ts`

## QA e rollback

Seguir `docs/architecture/m-crm-mvp.md`. Rollback remove somente o módulo CRM novo e sua composição; não altera os módulos ERP existentes.
