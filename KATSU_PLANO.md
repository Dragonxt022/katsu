# Katsu — Plano de Desenvolvimento

> **Rascunho v0.1** — plataforma comercial modular desktop-first.
> Documento vivo. Serve de referência para desenvolvimento humano **e** para execução por agente.

---

## 1. Visão do produto

Katsu não é "um sistema para restaurantes". É uma **plataforma comercial modular**: um núcleo estável (Core) sobre o qual se instalam *Apps* de segmento (Restaurante, Mercado, Farmácia, Oficina, etc.), como aplicativos em um celular.

O sistema cresce conforme o cliente cresce. O cliente instala apenas o que usa.

**Princípios inegociáveis:**

1. **Core independente de segmento.** Nenhuma regra de negócio de segmento pode vazar para o Core.
2. **Offline-first.** Tudo funciona sem internet; a nuvem é sincronização e serviços, nunca dependência de operação.
3. **Segurança primeiro.** Autenticação, permissões e auditoria são a Fase 1, não um recurso posterior.
4. **IDs universais (UUID) para sincronização.** O ID interno do SQLite nunca cruza máquinas.
5. **Cada módulo atualiza sozinho.** Sem obrigar atualização do sistema inteiro.

---

## 2. Arquitetura em 4 camadas

```
Katsu
│
├── Core       → nunca muda; infraestrutura reutilizável
├── Shared     → funções puras reaproveitáveis (money, cpf, pdf, pix...)
├── Apps       → segmentos de negócio (restaurant, market, pharmacy...)
└── Plugins    → extensões de terceiros (futuro)
```

### Regra de dependência (crítica para o agente)

```
Plugins  →  Apps  →  Shared  →  Core
```

A seta indica "pode importar de". **Nunca o contrário.** Core não conhece Apps. Shared não conhece Apps. Um App não importa de outro App diretamente — comunicação entre Apps passa por eventos/serviços do Core.

---

## 3. Stack tecnológica

| Camada | Escolha | Observação |
|---|---|---|
| Runtime desktop | **Electron** | empacotamento e auto-update |
| Servidor local | **Express 5** | API local (localhost) dentro do Electron |
| Linguagem | **TypeScript** | padrão em todo o projeto |
| Banco local | **better-sqlite3** | síncrono, muito mais rápido que `sqlite3` |
| ORM / query builder | **Drizzle ORM** | migrations versionadas, tipagem forte |
| Padrão | **MVC + Services/Repositories** | camadas explícitas |
| Nuvem (VPS) | Node + Express + Postgres | painel admin, licenças, sync |

---

## 4. Estrutura de pastas

```
katsu/
├── src/
│   ├── core/
│   │   ├── auth/            # login, sessão, hash, remember
│   │   ├── security/        # rate-limit, sanitização, headers
│   │   ├── users/           # CRUD usuários, cargos
│   │   ├── permissions/     # RBAC por módulo/ação
│   │   ├── audit/           # logs de auditoria
│   │   ├── database/        # conexão, migrations, seeds
│   │   ├── sync/            # motor de sincronização (UUID)
│   │   ├── cache/
│   │   ├── logs/
│   │   ├── backup/
│   │   ├── license/         # validação de licença/plano
│   │   ├── notifications/
│   │   ├── printing/        # impressão térmica/A4
│   │   ├── reports/         # engine de relatórios
│   │   ├── updater/         # auto-update app + módulos
│   │   └── config/
│   │
│   ├── shared/
│   │   ├── money/           ├── cpf/            ├── cnpj/
│   │   ├── cep/             ├── phone/          ├── dates/
│   │   ├── masks/           ├── validators/     ├── pdf/
│   │   ├── qrcode/          ├── barcode/        ├── pix/
│   │   ├── taxes/ (ncm/cfop)├── ibge/           └── xml-danfe/
│   │
│   ├── modules/            # os "Apps"
│   │   ├── restaurant/
│   │   ├── market/
│   │   ├── pharmacy/
│   │   ├── workshop/
│   │   ├── carwash/
│   │   └── electronics/
│   │     └── (cada módulo:) controllers/ models/ views/ routes/
│   │         services/ repositories/ permissions/ config/ migrations/
│   │
│   ├── routes/            # registro central de rotas
│   ├── public/            # assets estáticos
│   ├── electron/          # main process, preload, janelas
│   └── config/
│
├── storage/  temp/  uploads/  database/
├── drizzle/              # migrations geradas
├── package.json
└── KATSU_PLANO.md
```

**Contrato de módulo.** Cada App expõe um `module.manifest.ts`:

```ts
export default {
  id: 'restaurant',
  name: 'Restaurante',
  version: '1.0.0',
  requiresCore: '>=1.0.0',
  permissions: ['restaurant.orders', 'restaurant.kitchen', ...],
  migrations: './migrations',
  routes: './routes',
  menu: [ /* itens de menu injetados na UI */ ],
}
```

O Core descobre, valida e carrega módulos a partir desse manifesto. Instalar/remover um App = registrar/desregistrar o manifesto + rodar/reverter migrations.

---

## 5. Roadmap por fases

Cada fase abaixo tem: **objetivo · entregáveis · definição de pronto (DoD)**. Um agente deve concluir a DoD de uma fase antes de abrir a próxima.

### Fase 0 — Arquitetura e fundação
**Objetivo:** esqueleto executável com sistema de módulos funcionando (mesmo vazio).
**Entregáveis:**
- Projeto Electron + Express 5 + TypeScript rodando.
- `better-sqlite3` + Drizzle configurados, primeira migration.
- Loader de módulos lendo `module.manifest.ts`.
- Auto-updater esqueleto (app e módulos separados).
- Padrões de código: ESLint, Prettier, estrutura de commits, scripts npm.
**DoD:** app abre, carrega um módulo "hello" fictício via manifesto, migration roda e reverte.

### Fase 1 — Core: segurança
**Objetivo:** ninguém entra sem autenticar; nada acontece sem permissão; tudo fica registrado.
**Entregáveis:**
- **Auth:** login, logout, hash de senha (argon2/bcrypt), sessão, "lembrar login".
- **Usuários e cargos:** Administrador, Gerente, Operador, Caixa, Entregador, Estoquista.
- **Permissões (RBAC) por módulo e ação:** visualizar, criar, editar, excluir, exportar, imprimir — e permissões finas (ex.: "alterar preço", "alterar estoque" separadas de "editar produto").
- **Auditoria:** todo evento gera log (usuário, ação, entidade, antes/depois, hora, IP, máquina).
- Configurações, backup local, licenciamento base.
**DoD:** usuário sem permissão de "excluir" não consegue excluir por nenhuma via (UI ou rota); toda ação sensível aparece no log de auditoria.

### Fase 2 — Shared (biblioteca compartilhada)
**Objetivo:** funções puras, testadas, reaproveitáveis por todos os Apps.
**Entregáveis:** money, datas, CPF/CNPJ, CEP, telefone, máscaras, validators, PDF, QR Code, código de barras, PIX, impressão, impostos (NCM/CFOP), IBGE.
**DoD:** cada utilitário com testes unitários; zero dependência de Core ou de Apps (funções puras).

### Fase 3 — Comercial (base transacional)
**Objetivo:** cadastros e estoque que sustentam qualquer segmento.
**Entregáveis:** clientes, fornecedores, produtos, categorias, estoque, compras.
**DoD:** CRUD completo com permissões e auditoria aplicadas; movimentação de estoque consistente.

### Fase 4 — Financeiro
**Objetivo:** dinheiro entra e sai de forma rastreável.
**Entregáveis:** caixa, contas a pagar, contas a receber, fluxo de caixa, relatórios financeiros.
**DoD:** abertura/fechamento de caixa confere; relatório de fluxo bate com lançamentos.

### Fase 5 — Apps (segmentos)
**Objetivo:** primeiro segmento comercializável ponta a ponta.
**Ordem sugerida:** ~~Restaurante primeiro~~ → **DECIDIDO (2026-07-06): Loja/varejo primeiro** (módulo `store`: PDV genérico para material de construção, mercado, roupas). Restaurante, Farmácia, Oficina, Lava Jato e Eletrônica vêm depois, reaproveitando commercial + finance + store.
**Entregáveis por App:** PDV, delivery, produção/cozinha, regras específicas do segmento.
**DoD:** um restaurante consegue operar um dia inteiro só com o Katsu (venda → produção → caixa → relatório).

### Fase 6 — Nuvem
**Objetivo:** multi-dispositivo e continuidade.
**Entregáveis:** motor de sincronização por UUID com resolução de conflitos, assinaturas, backup em nuvem, painel administrativo (VPS).
**DoD:** duas máquinas offline editam, reconectam e convergem sem perda nem duplicação.

### Fase 7 — IA e ecossistema
**Objetivo:** plataforma aberta.
**Entregáveis:** assistente com IA, automações, API pública, marketplace de módulos, plugins de terceiros.
**DoD:** um plugin externo instala e funciona sem alterar o Core.

---

## 6. Sincronização (contrato)

- Toda entidade sincronizável tem `id` (SQLite, local) **e** `uuid` (universal).
- SQLite usa `id` internamente; a sincronização usa **somente `uuid`**.
- Campos de controle obrigatórios: `uuid`, `updated_at`, `deleted_at` (soft delete), `synced_at`, `origin_machine`.
- Estratégia de conflito padrão: **last-write-wins por campo** com log de auditoria do conflito; entidades críticas (financeiro) podem exigir merge manual.

```
Internet volta → enviar alterações → servidor → receber alterações
              → resolver conflitos (por UUID) → registrar → fim
```

---

## 7. Licenciamento

Cada instalação combina:

```
Machine ID  +  Empresa ID (UUID)  +  License Key
```

O servidor mantém, por empresa: licença → módulos habilitados → plano → validade → última sincronização. O Core valida a licença no boot (com tolerância offline configurável para não travar operação sem internet).

---

## 8. Backup

- **Automático:** diário às 23:00 → compacta o SQLite → envia à nuvem (se houver assinatura).
- **Sem assinatura:** backup local direcionável (Documentos, pendrive, HD).
- Restauração validada por checksum.

---

## 9. Painel Administrativo (VPS) — praticamente outro sistema

Escopo: clientes, assinaturas, licenças, máquinas, sincronizações, financeiro (boletos/PIX), atualizações, módulos, logs, suporte, downloads.

---

## 10. Ordem de ataque recomendada para o agente

1. Fase 0 completa e testada (fundação não se refatora depois).
2. Fase 1 **inteira** antes de qualquer tela de negócio — segurança não se "adiciona depois".
3. Fase 2 conforme demanda das fases seguintes (implemente o utilitário quando o primeiro consumidor aparecer, com teste).
4. Fases 3 → 4 → 5 em sequência, entregando **Restaurante** como primeiro App vendável.
5. Nuvem (Fase 6) só quando um App já roda 100% offline.
6. Ecossistema (Fase 7) por último.

**Regra de ouro para o agente:** ao começar qualquer tarefa, respeitar a regra de dependência da seção 2 e o contrato de módulo da seção 4. Se uma implementação exigir que o Core conheça um App, a arquitetura está sendo violada — parar e revisar.

---

## 11. Pontos em aberto (decidir antes de codar)

- Nome definitivo dos identificadores comerciais (Katsu Business? Katsu Platform?).
- Banco da nuvem: Postgres (recomendado) vs. MySQL (você já domina).
- ~~Biblioteca de hash~~ → **DECIDIDO (2026-07-05): bcrypt** (implementado via `bcryptjs`, API idêntica, sem dependência nativa — troca por `bcrypt` nativo é drop-in se necessário).
- ~~Estratégia de views~~ → **DECIDIDO (2026-07-05): EJS + Alpine.js** (server-rendered, sem build step, Alpine servido localmente para manter offline-first).
- Modelo de precificação por módulo (assinatura mensal, licença perpétua, híbrido).
