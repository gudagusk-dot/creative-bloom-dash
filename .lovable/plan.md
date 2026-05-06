# Quick Wins Visuais — Refinamento completo

Vou aplicar uma rodada de polimento estético em todo o app, sem mexer em lógica de negócio. O objetivo é elevar a percepção de qualidade do produto: tipografia mais editorial, paleta mais sofisticada, mais respiro, microinterações suaves e estados vazios bonitos.

---

## 1. Tipografia editorial

- Adicionar par tipográfico premium:
  - **Fraunces** (display serif moderno) para títulos grandes, headings de página e números de KPI
  - **Inter** continua como body (já está)
- Configurar `font-display` e `font-sans` no Tailwind
- Aplicar hierarquia consistente: H1 em Fraunces, subtítulos e UI em Inter
- Aumentar `tracking` em títulos e `leading` em parágrafos

## 2. Paleta refinada (light + dark)

- Dessaturar levemente as 6 cores de categoria — versão "soft" pra fundo dos cards do calendário (opacidade ~15%) e cor cheia só nos badges/dots
- Trocar o roxo primário por um tom mais sofisticado e menos saturado (algo entre violeta profundo e índigo) que funciona bem em light e dark
- Refinar tokens neutros: backgrounds com leve warm tint em vez de cinza puro
- Sombras mais suaves com tom da cor primária (em vez de preto puro)
- Bordas mais sutis (menor opacidade)

## 3. Mais respiro e hierarquia

- Aumentar padding interno de cards, drawers e dialogs
- Espaçamento maior entre seções
- KPI cards com números grandes em Fraunces, label pequeno em Inter uppercase
- TopBar com mais ar, divisor de filtros mais sutil
- Calendário: células com padding ligeiramente maior, transições nas bordas

## 4. Microinterações com framer-motion

- Instalar `framer-motion`
- Aplicar:
  - Fade + slide nos drawers (PostDrawer, ProgressPanel)
  - Stagger fade-in nos cards de aluno (StudentsDashboard)
  - Hover scale sutil + sombra colorida nos cards do calendário
  - Transição suave ao trocar de mês no calendário
  - Scale-in nos dialogs (NewPostDialog, NewStudentDialog, ShareDialog)
  - Animação no FAB mobile (pulse leve)
- Usar `motion.div` apenas onde agrega — sem exagero

## 5. Estados vazios bonitos

- **StudentsDashboard sem alunos**: ilustração leve (ícone grande estilizado) + título em Fraunces + CTA "Adicionar primeiro aluno"
- **Calendário sem posts no mês**: mensagem amigável centralizada com ícone
- **ProgressPanel sem atividade**: ícone + texto explicativo
- **Filtros sem resultado**: feedback claro

## 6. Login com split-screen elegante

- Layout em 2 colunas no desktop:
  - Esquerda: visual com gradiente sofisticado (do primary pro accent), padrão sutil de fundo, citação ou tagline em Fraunces grande
  - Direita: formulário minimalista, mais respiro, input maior, botão com hover refinado
- Mobile: cai pra coluna única mantendo o cabeçalho visual no topo

## 7. Componentes pontuais

- **TopBar**: avatar do admin com ring sutil, ThemeToggle com transição de ícone
- **Filtros de categoria**: pill mais arredondado, transição de cor mais suave
- **Cards de aluno**: hover com lift sutil (translate-y + shadow colorida), avatar com inicial em Fraunces
- **Botões**: refinar variants do shadcn pra incluir um `premium` com gradient sutil

---

## Arquivos que vou tocar

**Tokens / config:**
- `src/index.css` — paleta refinada, novas variáveis de sombra/gradiente, import de Fraunces
- `tailwind.config.ts` — adicionar `font-display`, animations extras, sombras customizadas
- `package.json` — adicionar `framer-motion`

**Componentes visuais:**
- `src/pages/Login.tsx` — split-screen
- `src/pages/StudentsDashboard.tsx` — empty state + stagger animation
- `src/components/StudentCard.tsx` — hover refinado, avatar
- `src/components/CalendarGrid.tsx` — paleta soft, transições, empty state
- `src/components/CalendarHeader.tsx` — tipografia
- `src/components/KpiCards.tsx` — números em Fraunces
- `src/components/TopBar.tsx` — refinamentos visuais
- `src/components/PostDrawer.tsx` — animação de entrada
- `src/components/ProgressPanel.tsx` — animação + empty state
- `src/components/NewPostDialog.tsx`, `NewStudentDialog.tsx`, `ShareDialog.tsx` — scale-in
- `src/components/ThemeToggle.tsx` — transição de ícone
- `src/components/ui/button.tsx` — variant `premium`

**Sem mexer em:**
- Lógica de Context (ContentContext, StudentsContext, UserContext, ThemeContext)
- Schema de banco / migrations
- Edge functions
- Roteamento
- `supabase/client.ts`, `types.ts`

---

## Resultado esperado

- App com aparência claramente mais "premium" e editorial
- Tema dark e light ambos polidos
- Sensação de fluidez nas interações sem lentidão
- Estados vazios deixam de ser "buracos" e viram oportunidades de orientação

Sem nenhuma mudança de funcionalidade — tudo continua funcionando exatamente igual, só fica mais bonito.
