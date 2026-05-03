## Plano — Compartilhamento e Acompanhamento do Aluno

A ferramenta está ótima. Vamos focar só na parte do **professor**: melhorar o botão "Compartilhar com aluno" e criar uma **área de acompanhamento do progresso** do aluno.

---

### 1. Modal "Compartilhar com aluno"

Hoje o botão só copia o link de forma silenciosa (sem feedback claro), o que dá a impressão de que "não funciona". Vamos transformar em um **modal dedicado** com:

- Título: "Compartilhar calendário com o aluno"
- Explicação curta: "Envie este link para seu aluno. Ele poderá ver o calendário, marcar status e enviar mídias — sem precisar de login."
- Campo de texto com o link `/aluno/{seuId}` (somente leitura, selecionável)
- Botão **"Copiar link"** com confirmação visual ("Copiado!")
- Botão **"Abrir em nova aba"** para o professor pré-visualizar a versão do aluno
- Botão **"Compartilhar no WhatsApp"** (abre `https://wa.me/?text=...` com o link pré-preenchido)
- QR Code do link (útil para mostrar no celular do aluno presencial)

### 2. Painel "Progresso do Aluno" (novo)

Novo botão na TopBar do admin: **"Progresso"** (ícone de gráfico). Abre um **drawer/modal lateral** com:

**Resumo no topo (cards pequenos):**
- Total de conteúdos do mês
- Publicados / Em produção / A fazer (com %)
- Total de mídias enviadas pelo aluno

**Linha do tempo de atividade:**
- Lista cronológica das últimas mudanças feitas pelo aluno:
  - "Marcou *Título do post* como Publicado" — há 2h
  - "Enviou 3 mídias para *Título do post*" — ontem
  - "Marcou como Em produção" — há 3 dias

**Galeria de mídias enviadas:**
- Grid com todas as mídias (fotos/vídeos) que o aluno subiu
- Cada miniatura mostra a qual post pertence (clicável → abre o PostDrawer)
- Filtro por status do post

**Lista de pendências:**
- Posts cuja data já passou e ainda estão como "A fazer" (atrasados — em vermelho)
- Posts da próxima semana ainda "A fazer" (próximos — em amarelo)

### 3. Como o tracking vai funcionar (back-end)

Para o painel de progresso mostrar histórico ("o aluno marcou X há 2h"), precisamos registrar as ações do aluno. Nova tabela:

```
post_activity
  id uuid pk
  post_id uuid → content_posts.id
  user_id uuid (dono do calendário, para filtro/RLS)
  action text   ('status_changed' | 'media_uploaded' | 'media_removed')
  details jsonb ({ from: 'A fazer', to: 'Publicado', count: 3, ... })
  created_at timestamptz default now()
```

- Quando o aluno muda status no `PostDrawer` → insere linha em `post_activity`.
- Quando faz upload no `MediaUploader` → insere linha.
- RLS: leitura/escrita pública (igual `content_posts`, alinhado ao modelo atual sem login do aluno).
- Realtime habilitado → professor vê atividade ao vivo enquanto o aluno mexe.

### 4. Acesso do aluno (sem mudanças funcionais)

Confirmando o que já existe e está correto:
- Aluno entra **só** pelo link `/aluno/{ownerId}` — não há tela de login para ele.
- Não consegue criar/excluir/editar conteúdo.
- Pode: trocar **status**, fazer **upload de mídias**, ler **roteiro**.

Pequeno ajuste de UX no modo aluno: esconder o botão "Novo Conteúdo" mobile (FAB) — hoje ele aparece só no Index, mas vamos garantir que não vaze para a StudentView.

---

### Arquivos afetados

- **Novo** `src/components/ShareDialog.tsx` — modal com link, copiar, WhatsApp, QR code, abrir preview
- **Novo** `src/components/ProgressPanel.tsx` — drawer com KPIs, timeline, galeria, pendências
- **Novo** `src/lib/activity.ts` — helpers `logActivity(postId, action, details)`
- **Editar** `src/components/TopBar.tsx` — abrir ShareDialog em vez de copiar direto; adicionar botão "Progresso" (admin)
- **Editar** `src/components/PostDrawer.tsx` — chamar `logActivity` ao trocar status (modo aluno)
- **Editar** `src/components/MediaUploader.tsx` — chamar `logActivity` em upload/remoção (modo aluno)
- **Migration**: criar tabela `post_activity` + RLS pública + realtime + index por `user_id, created_at`
- **Dependência nova**: `qrcode.react` para o QR Code

Confirma que pode aplicar?
