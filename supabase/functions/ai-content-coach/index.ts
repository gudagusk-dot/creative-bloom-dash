import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, content, context, posts_context, format, theme, model: modelOverride } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build a clean context summary if posts_context array is provided
    let calendarSummary = context || ""
    if (Array.isArray(posts_context) && posts_context.length) {
      calendarSummary = posts_context.slice(0, 30).map((p: any, i: number) => {
        const script = (p.script || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240)
        return `${i + 1}. [${p.category || "—"}] ${p.title} (${p.format} · ${p.network} · ${p.status})${script ? `\n   Roteiro: ${script}` : ""}`
      }).join("\n")
    }

    const systemPrompt = `Você é a **Brenda IA** — estrategista sênior de social media e copywriter de elite, fluente em qualquer nicho.

COMO VOCÊ TRABALHA:
1. Antes de qualquer entrega, leia o calendário do aluno e infira automaticamente: nicho, subnicho, persona/ICP, tom de voz, posicionamento, oferta principal e estágio do funil. NÃO peça essas informações — deduza.
2. Adapte 100% das sugestões ao nicho detectado. Se for educação, use exemplos de educação. Se for fitness, use fitness. Se for advocacia, food, beleza, infoproduto, B2B, dev, imóveis, saúde, e-commerce, etc. — siga o universo do aluno.
3. Toda saída precisa de: gancho específico (com número, callout, contraste ou afirmação polarizadora), gatilho psicológico declarado, estrutura por tempo/slide, CTA de baixa fricção.

REPERTÓRIO QUE VOCÊ DOMINA (base mental — NUNCA cite as fontes nas respostas):
- **Copywriting clássico:** Eugene Schwartz (níveis de consciência), David Ogilvy, Gary Halbert, Joe Sugarman (axioms), Robert Collier.
- **Frameworks de copy:** AIDA, PAS, BAB (Before-After-Bridge), 4Ps (Promessa-Pintura-Prova-Push), FAB, StoryBrand (Donald Miller), Hero's Journey.
- **Persuasão & gatilhos:** Cialdini (reciprocidade, compromisso, prova social, autoridade, afinidade, escassez, unidade), Cashvertising (Drew Whitman, Life-Force 8), pré-suasão.
- **Ofertas & vendas:** Alex Hormozi (100M Offers — value equation; 100M Leads — lead magnets), Russell Brunson (DotCom/Expert Secrets, Hook-Story-Offer), Grant Cardone (10X), Jordan Belfort (straight line), Chet Holmes.
- **Conteúdo viral & retenção:** Brendan Kane (Hook Point — 3s), Made to Stick (Heath, SUCCES), Contagious (Berger, STEPPS), curvas de retenção do TikTok, jump cuts, pattern interrupts, curiosity gap, open loops.
- **Brasileiros (use como repertório forte):** **Leandro Ladeira** (gatilhos mentais aplicados, copy direta br, escassez, prova, autoridade, oferta irresistível), **Erico Rocha** (fórmula de lançamento), **Pedro Sobral** (tráfego pago/funis), **Camila Porto** (Instagram para negócios), **Camilo Coutinho** (orgânico/SEO/YouTube), **Felipe Castanhari** (storytelling), **Gabriel Goffi** (oratória), **Tiago Tessmann** (vídeo curto), **Bruno Picinini** (copy/e-mail).
- **Marketing & funil:** Seth Godin (permission), Neil Patel (SEO/funis), tráfego orgânico vs pago, funil TOFU/MOFU/BOFU, jornada de consciência, ICP, posicionamento (Ries & Trout), Blue Ocean.
- **Networking & autoridade:** Keith Ferrazzi, Dorie Clark, marca pessoal, expert positioning.
- **Plataformas:** padrões nativos de Reels/TikTok (0-3s gancho, 3-15s payoff, 15-30s prova, CTA), Carrosséis (capa polarizadora → contexto → dor → virada → método → exemplo → CTA salvar/compartilhar), Stories (microcaixinhas), YouTube Shorts, threads/X, LinkedIn (carrossel + opinião forte).

REGRAS DE FORMATAÇÃO (OBRIGATÓRIAS):
- Responda SEMPRE em **português do Brasil** em **Markdown rico**.
- Use "##" para o título principal e "###" para subseções. NUNCA use "#" sozinho.
- Comece com um título "##" claro identificando o que está sendo entregue.
- Separe blocos/ideias com "\n\n---\n\n".
- Use emojis funcionais como prefixo de cada subseção (📊 🎯 🔁 ✅ ⚠️ 🚀 🪝 🎬 📢 💬 🎞️ 📌 💡 🧲) — sempre o mesmo emoji para a mesma função.
- Campos importantes em **negrito** seguidos de dois pontos. Listas com "-" ou numeradas.
- Roteiros DEVEM ter: **🪝 Gancho (0-3s)**, **🎬 Desenvolvimento**, **📢 CTA**, **💬 On-screen text**, **🎞️ Sugestões de corte**.
- Sem introduções longas, sem "claro!", sem repetir a pergunta. Vá direto ao valor.
- Seja específica para o NICHO DETECTADO — nada de conselhos genéricos.`

    let prompt = ""
    if (action === 'analyze') {
      prompt = `Analise o calendário de conteúdo abaixo de forma estratégica e acionável.

Use EXATAMENTE este formato Markdown (mantenha os emojis):

## 📊 Análise do Calendário

### 📈 Visão geral
(2-3 linhas com diagnóstico real, não genérico)

### 🎯 Tom de voz e posicionamento
- ...

### 🔁 Temas recorrentes
- ...

### ✅ Pontos fortes
- ...

### ⚠️ Lacunas e riscos
- ...

### 🧲 Oportunidades de gancho não exploradas
- ...

---

## 🚀 3 ajustes táticos prioritários

### 1. [Título acionável]
**O quê:** ...
**Por quê:** ...
**Como aplicar:** ...

### 2. [Título acionável]
**O quê:** ...
**Por quê:** ...
**Como aplicar:** ...

### 3. [Título acionável]
**O quê:** ...
**Por quê:** ...
**Como aplicar:** ...

CALENDÁRIO:
${calendarSummary}`
    } else if (action === 'suggest') {
      const fmtMap: Record<string, string> = {
        video: "Reels / TikTok (vídeo curto vertical)",
        carrossel: "Carrossel (Instagram, 6-10 slides)",
        ambos: "Misto: alterne entre Reels/TikTok e Carrossel",
      }
      const formatLine = format && fmtMap[format] ? `FORMATO SOLICITADO: ${fmtMap[format]}` : "FORMATO: livre (escolha o melhor para cada ideia)"
      const themeLine = theme ? `TEMA/OBJETIVO DO BRIEFING: ${theme}` : ""

      prompt = `Com base no calendário abaixo e no briefing, gere **exatamente 3 ideias** de posts — criativas, específicas para o NICHO detectado no calendário, alinhadas ao estilo do aluno mas trazendo variedade e ganchos fortes.

${formatLine}
${themeLine}

Use EXATAMENTE este template Markdown para CADA uma das 3 ideias, separadas por "---":

## 💡 Ideia N — [Título magnético do post]

### 🪝 Gancho (0-3s)
> "[fala/texto literal do gancho, em primeira pessoa, pronto para gravar]"

### 📌 Resumo da ideia
(1-2 linhas explicando o ângulo e por que funciona)

### 🎯 Detalhes
- **Formato:** ...
- **Plataforma:** ...
- **Categoria:** ...
- **Público-alvo:** ...
- **Gatilho psicológico:** (curiosidade / contraste / autoridade / etc.)

### 🎬 Estrutura sugerida
1. **(0-3s) Gancho:** ...
2. **(3-10s) Contexto/Dor:** ...
3. **(10-25s) Virada/Método:** ...
4. **(25-40s) Prova/Exemplo:** ...
5. **(40-50s) CTA:** ...

### 📢 CTA
...

### 💬 On-screen text (3-5 frases curtas)
- ...

---

REGRAS:
- Gere EXATAMENTE 3 ideias — nem mais, nem menos.
- Não repita ângulos do calendário existente.
- Cada gancho precisa ser específico (mencione número, palavra ou afirmação polarizadora) — nada genérico tipo "Você sabia que…".
- Sem introdução antes da Ideia 1.

CALENDÁRIO ATUAL DO ALUNO:
${calendarSummary}`
    } else if (action === 'rewrite') {
      prompt = `Reescreva o roteiro abaixo aplicando copywriting de alto nível: gancho cirúrgico, ritmo, micro-loops, prova e CTA de baixa fricção. Mantenha o objetivo central.

Use EXATAMENTE este formato:

## ✍️ Roteiro Reescrito

### 🪝 Gancho (0-3s)
> "[fala literal]"

### 🎬 Desenvolvimento
(parágrafos curtos com falas literais e indicações entre parênteses)

### 📢 CTA
...

### 💬 On-screen text
- ...

### 🎞️ Sugestões de corte
- ...

---

## 🔍 O que mudou e por quê
- **Gancho:** ...
- **Estrutura:** ...
- **Linguagem:** ...
- **CTA:** ...

ROTEIRO ORIGINAL:
${content}`
    } else if (action === 'script') {
      prompt = `Crie um roteiro completo de Reels/TikTok sobre o tema abaixo, aplicando copywriting persuasivo.

Use EXATAMENTE este formato:

## 🎬 Roteiro: ${content}

### 🪝 Gancho (0-3s)
> "[fala literal]"

### 🎬 Desenvolvimento
(parágrafos curtos, falas literais, indicações de B-roll entre parênteses)

### 📢 CTA
...

### 💬 On-screen text
- ...

### 🎞️ Sugestões de corte
- ...

TEMA: ${content}

${calendarSummary ? `CONTEXTO (estilo do aluno, somente referência):\n${calendarSummary}` : ""}`
    } else if (action === 'chat') {
      prompt = `Pergunta do usuário:
${content}

Responda em Markdown bem estruturado seguindo as regras de formatação. Comece com um título "##", use "###" para subseções com emojis, e separe blocos com "---".

---
CONTEXTO (calendário do aluno, somente referência):
${calendarSummary}`
    } else {
      prompt = content || ""
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelOverride || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      let userMsg = `Falha no Lovable AI Gateway (${response.status})`
      if (response.status === 429) userMsg = "Limite de requisições atingido. Tente novamente em alguns segundos."
      else if (response.status === 402) userMsg = "Créditos do Lovable AI esgotados. Adicione créditos em Configurações > Workspace > Uso."
      else if (response.status === 401) userMsg = "Chave do Lovable AI inválida."
      console.error("[brenda-ia] gateway error", response.status, errText)
      return new Response(JSON.stringify({ error: userMsg }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content || ""
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error("[brenda-ia] unhandled", error)
    return new Response(JSON.stringify({ error: error.message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
