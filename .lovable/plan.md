## Plano consolidado: redesign do Login + ajustes no painel do cliente

### 1. Redesign da tela de Login
Visual editorial moderno, alinhado às referências (Velorah / paleta verde + Fraunces italic).

- **Layout**: split em duas colunas no desktop, empilhado no mobile.
  - **Esquerda (desktop)**: imagem cinematográfica em tela cheia (céu dourado/laranja ao entardecer) com overlay sutil e a tagline "Plano de Conteúdo®" em small caps + uma frase editorial em `Fraunces` light italic.
  - **Direita**: formulário minimal centralizado, fundo neutro, com título grande em `Fraunces` italic ("Bem-vinda de volta"), inputs em `Geist`, botão primário sólido.
- **Tipografia**: títulos em `Fraunces` light italic; labels, inputs e botões em `Geist`.
- **ThemeToggle**: permanece no canto superior direito.
- **Animação**: fade + slide (mantém lógica atual com `framer-motion` se já presente, senão CSS simples).
- **Imagem hero**: gerar `src/assets/login-hero.jpg` (1024x1280, céu dourado cinematográfico).
- **Lógica de auth**: sem alteração — mesmos handlers e chamadas existentes.

Arquivos: `src/pages/Login.tsx` (rewrite do layout), `src/assets/login-hero.jpg` (novo).

### 2. Painel do cliente — remover filtros do topo
Os chips de categorias (Educativo / Situações Reais / Autoridade / Destrave seu Inglês / Bastidores) e o filtro de redes (Instagram/TikTok) ficam em `TopBar.tsx` e poluem a visão do cliente.

Mudança: esconder o bloco inteiro de filtros (categorias + redes + botão de gerenciar) quando `viewMode === "student"`. Continua intacto para o ADM.

Arquivo: `src/components/TopBar.tsx`.

### 3. Saudação com data dinâmica
Já está dinâmica em `StudentOverview.tsx` via `format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })`. Vou apenas garantir que `today` seja calculado a cada render (sem `useMemo` com deps vazias) para nunca cachear.

Arquivo: `src/components/StudentOverview.tsx`.

### 4. Mobile: "Ver Calendário" em destaque no topo
Hoje, no mobile, o card "Ver Calendário Completo" e o aviso de pendências aparecem **abaixo** das listas e ficam escondidos no fim da tela.

Mudança no `StudentOverview.tsx`:
- Reordenação responsiva com classes `order-*` do Tailwind.
- No mobile: `Ver Calendário` (destaque) → `Posts Pendentes` (se houver) → `Para hoje` → `Próximos 7 dias` → `Desempenho do mês`.
- No desktop: mantém o grid atual de duas colunas com a lateral à direita.

Layout mobile resultante:
```text
┌─────────────────────────┐
│ Saudação + data         │
├─────────────────────────┤
│ [ Ver Calendário → ]    │  ← destaque
├─────────────────────────┤
│ ⚠ Posts Pendentes       │  ← se houver
├─────────────────────────┤
│ Para hoje               │
├─────────────────────────┤
│ Próximos 7 dias         │
├─────────────────────────┤
│ Desempenho do mês       │
└─────────────────────────┘
```

---

### Arquivos afetados
- `src/pages/Login.tsx` — redesign completo (mantém auth)
- `src/assets/login-hero.jpg` — nova imagem hero
- `src/components/TopBar.tsx` — esconder filtros no modo cliente
- `src/components/StudentOverview.tsx` — data sempre fresca + reordenação mobile

Sem mudanças no backend.