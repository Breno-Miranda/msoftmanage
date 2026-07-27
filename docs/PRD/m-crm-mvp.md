# PRD — M-CRM MVP

**Produto:** M-CRM
**Status:** Ready for Delivery
**Data:** 2026-07-27
**Sistema de API:** m-manage

## Visão

M-CRM é o produto SaaS do ecossistema Miranda Soft para equipes de vendas de clientes finais. O MVP reduz trabalho operacional ao centralizar clientes, oportunidades e próximos passos em um funil simples.

## Público-alvo

Pequenas equipes comerciais de empresas clientes da Miranda Soft que acompanham vendas por planilhas, WhatsApp ou memória individual.

## Problema

Sem um registro compartilhado e segmentado por organização, vendedores perdem contexto de clientes, deixam follow-ups atrasarem e não têm visibilidade básica do funil.

## Objetivo do MVP

Permitir que uma organização autorizada registre clientes, acompanhe oportunidades por estágio e veja a próxima ação comercial sem expor dados entre organizações.

## Escopo MVP

1. Base de clientes: criar, listar, atualizar e arquivar clientes.
2. Funil: criar e movimentar oportunidades entre estágios configurados no produto.
3. Atividades: registrar nota e próxima ação datada para cliente ou oportunidade.
4. Visão operacional: lista de oportunidades abertas e ações vencidas/próximas.
5. Acesso: usuários com entitlement `crm-enterprise` e associação ativa à organização.

## Fora de escopo do MVP

- Integração com WhatsApp, e-mail, telefonia, ERPs ou calendário externo.
- Automação de campanhas, IA generativa, previsão de vendas, comissões e múltiplos pipelines.
- Importação/exportação em massa, anexos e relatórios financeiros.
- Cobrança, planos e provisionamento comercial novos; o catálogo existente continua a fonte do entitlement `crm-enterprise`.

## Requisitos não funcionais

- Todo registro de CRM é restrito pelo contexto de organização resolvido no servidor.
- `appKey` do cliente não concede acesso; o servidor usa a chave fixa `crm-enterprise`.
- Dados de uma organização nunca são retornados, atualizados ou arquivados por outra.
- Operações de remoção usam arquivamento lógico.
- API segue os padrões Elysia, Bun, MongoDB/Mongoose e respostas do m-manage.

## Métricas de validação pós-MVP

A definir com clientes piloto: clientes cadastrados por organização, oportunidades abertas, atividades concluídas e taxa de follow-up no prazo. Não há baseline nem meta aprovada neste momento.

## Dependências e gates

| Item | Estado | Consequência |
| --- | --- | --- |
| Entitlement `crm-enterprise` no catálogo atual | Confirmado em `src/routes/catalog.ts` | Pode ser usado sem criar produto comercial duplicado. |
| Contexto de organização/membership | Confirmado no módulo `erpFinance` | Deve ser reutilizado, não substituído por filtro do cliente. |
| Frontend operacional do M-CRM | Pendente | Não criar uma nova aplicação sem repositório/host definido; o primeiro slice entrega contrato de API seguro. |
| Clientes piloto e métricas | Pendente | Não inventar métricas de negócio nem integrações externas. |
