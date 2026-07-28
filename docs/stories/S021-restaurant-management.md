# S021 — MVP de Gestão de Restaurantes

**Status:** In Progress  
**Módulo:** restaurant  
**Versão:** 1.0.0  
**Data:** 2026-07-27

---

## Contexto

Adicionar ao `m-manage` um módulo vertical de gestão de restaurantes, cobrindo o operacional mínimo viável: cardápio, mesas, comandas/pedidos, estoque com ficha técnica e relatórios gerenciais básicos. O módulo reutiliza a arquitetura existente (ElysiaJS, Mongoose, `appKey` como tenant, UUID v4, `checkTenantAccess`).

## Requisitos Funcionais

| # | Requisito |
|---|-----------|
| RF01 | Cadastro de categorias do cardápio por restaurante (`appKey`) |
| RF02 | Cadastro de itens do cardápio com variações, acréscimos e ficha técnica |
| RF03 | Cadastro de ingredientes com controle de estoque e estoque mínimo |
| RF04 | Cadastro de mesas com status de ocupação |
| RF05 | Abertura de comandas/pedidos vinculados a mesas ou balcão |
| RF06 | Adição e remoção de itens em pedidos abertos |
| RF07 | Atualização de status do pedido (`open`, `preparing`, `ready`, `closed`, `canceled`) |
| RF08 | Fechamento de pedido com cálculo de totais e baixa automática de estoque |
| RF09 | Relatório diário de vendas, quantidade de pedidos e ticket médio |
| RF10 | Relatório de itens mais vendidos |

## Modelo de Dados

### `mRestaurantMenuCategory`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| uuid | String (UUID v4, unique, immutable) | ID global |
| appKey | String (index) | Tenant |
| name | String | Nome da categoria |
| sortOrder | Number | Ordem de exibição |
| status | String | `active` \| `inactive` \| `archived` |

### `mRestaurantMenuItem`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| uuid | String (UUID v4, unique, immutable) | ID global |
| appKey | String (index) | Tenant |
| categoryId | String | UUID da categoria |
| name | String | Nome do item |
| slug | String | Gerado automaticamente |
| description | String | Descrição |
| price | Number | Preço base |
| cost | Number | Custo estimado |
| unit | String | `unidade` \| `kg` \| `g` \| `ml` |
| status | String | `active` \| `inactive` \| `archived` |
| variations | Array | `{ name, price, cost }` |
| addOns | Array | `{ name, price, cost }` |
| recipe | Array | `{ ingredientId, quantity }` ficha técnica |
| imageUrl | String | Imagem opcional |

### `mRestaurantIngredient`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| uuid | String (UUID v4, unique, immutable) | ID global |
| appKey | String (index) | Tenant |
| name | String | Nome do ingrediente |
| unit | String | `unidade` \| `kg` \| `g` \| `ml` \| `l` |
| stock | Number | Quantidade em estoque |
| minStock | Number | Estoque mínimo |
| cost | Number | Custo unitário médio |
| status | String | `active` \| `inactive` \| `archived` |

### `mRestaurantTable`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| uuid | String (UUID v4, unique, immutable) | ID global |
| appKey | String (index) | Tenant |
| number | String | Número/identificador da mesa |
| capacity | Number | Lugares |
| status | String | `free` \| `occupied` \| `reserved` \| `inactive` |

### `mRestaurantOrder`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| uuid | String (UUID v4, unique, immutable) | ID global |
| appKey | String (index) | Tenant |
| tableId | String \| null | Mesa vinculada |
| orderType | String | `dine_in` \| `takeout` |
| items | Array | `{ menuItemId, variationId?, addOnIds[], quantity, unitPrice, totalPrice, notes }` |
| subtotal | Number | Soma dos itens |
| serviceFee | Number | Taxa de serviço (%) |
| discount | Number | Desconto |
| total | Number | Total final |
| status | String | `open` \| `preparing` \| `ready` \| `closed` \| `canceled` |
| paymentStatus | String | `pending` \| `paid` |
| closedAt | Date | Data de fechamento |
| createdBy | String | UUID do usuário |

## Endpoints

Prefixo base: `/restaurant`

### Cardápio
| Método | Path | Descrição |
|--------|------|-----------|
| GET | /restaurant/menu/categories | Lista categorias |
| POST | /restaurant/menu/categories | Cria categoria |
| PUT | /restaurant/menu/categories/:uuid | Atualiza categoria |
| DELETE | /restaurant/menu/categories/:uuid | Soft delete |
| GET | /restaurant/menu/items | Lista itens |
| GET | /restaurant/menu/items/:uuid | Busca item por UUID |
| POST | /restaurant/menu/items | Cria item |
| PUT | /restaurant/menu/items/:uuid | Atualiza item |
| DELETE | /restaurant/menu/items/:uuid | Soft delete |

### Ingredientes
| Método | Path | Descrição |
|--------|------|-----------|
| GET | /restaurant/ingredients | Lista ingredientes |
| POST | /restaurant/ingredients | Cria ingrediente |
| PUT | /restaurant/ingredients/:uuid | Atualiza ingrediente |
| DELETE | /restaurant/ingredients/:uuid | Soft delete |
| POST | /restaurant/ingredients/:uuid/adjust | Ajusta estoque |

### Mesas
| Método | Path | Descrição |
|--------|------|-----------|
| GET | /restaurant/tables | Lista mesas |
| POST | /restaurant/tables | Cria mesa |
| PUT | /restaurant/tables/:uuid | Atualiza mesa |
| DELETE | /restaurant/tables/:uuid | Soft delete |

### Pedidos
| Método | Path | Descrição |
|--------|------|-----------|
| GET | /restaurant/orders | Lista pedidos |
| GET | /restaurant/orders/:uuid | Busca pedido por UUID |
| POST | /restaurant/orders | Abre pedido |
| POST | /restaurant/orders/:uuid/items | Adiciona item |
| DELETE | /restaurant/orders/:uuid/items/:itemId | Remove item |
| PATCH | /restaurant/orders/:uuid/status | Atualiza status |
| POST | /restaurant/orders/:uuid/close | Fecha pedido |
| DELETE | /restaurant/orders/:uuid | Cancela pedido |

### Relatórios
| Método | Path | Descrição |
|--------|------|-----------|
| GET | /restaurant/reports/daily | Resumo do dia |
| GET | /restaurant/reports/top-items | Itens mais vendidos |

## Decisões Técnicas

- UUID gerado com `crypto.randomUUID()` nativo do Bun/Node.
- Slug auto-gerado a partir do nome, com unicidade por `appKey + slug`.
- Soft delete padrão (`status → archived`); hard delete disponível em endpoint `/hard`.
- Fechamento de pedido baixa estoque automaticamente conforme a ficha técnica dos itens.
- Pedidos fechados não permitem mais alterações nos itens.
- Pagamento no MVP é simplificado: ao fechar, `paymentStatus` vai para `paid`.

## Arquivos Criados

- `docs/stories/S021-restaurant-management.md` (este arquivo)
- `src/models/mRestaurantMenuCategory.ts`
- `src/models/mRestaurantMenuItem.ts`
- `src/models/mRestaurantIngredient.ts`
- `src/models/mRestaurantTable.ts`
- `src/models/mRestaurantOrder.ts`
- `src/modules/restaurant/index.ts`
- `src/modules/restaurant/restaurant.controller.ts`
- `src/modules/restaurant/services/stock.service.ts`
- `src/modules/restaurant/services/order.service.ts`
- `src/modules/restaurant/services/report.service.ts`
- `tests/restaurant.test.ts`

## Arquivos Modificados

- `src/index.ts` — registro de `restaurantRoutes`
- `src/app.ts` — registro de `restaurantRoutes`
- `docs/framework/source-tree.md` — atualização da árvore
