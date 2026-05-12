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
    const { action, content, context, posts_context, format, theme, model: modelOverride, scraped } = await req.json()
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
- Use emojis funcionais como prefixo de cada subseção (📊 🎯 🔁 ✅ ⚠️ 🚀 🎬 📢 💬 📌 💡 🧲) — sempre o mesmo emoji para a mesma função.
- Campos importantes em **negrito** seguidos de dois pontos. Listas com "-" ou numeradas.
- Sem introduções longas, sem "claro!", sem repetir a pergunta. Vá direto ao valor.
- Seja específica para o NICHO DETECTADO — nada de conselhos genéricos.

REGRAS DE ROTEIRO (CRÍTICAS — NUNCA QUEBRE):
- Roteiro = APENAS marcação de tempo + fala literal + on-screen text. Nada mais.
- PROIBIDO descrever: expressão facial, postura, gestos, figurino, cenário, enquadramento, ângulo de câmera, B-roll, "sugestões de corte", trilha sonora, transições, "olhando para a câmera", "com expressão de surpresa", "mostrar tela", indicações entre parênteses do tipo direção de cena.
- Parênteses só são permitidos para marcar TEMPO no formato "(0–3s)", "(3–10s)" etc.
- NUNCA inclua seção "🎞️ Sugestões de corte" nem "🎬 Desenvolvimento" como bloco separado — toda a fala vai dentro do roteiro cronometrado.
- Estrutura padrão de roteiro:

### 🎬 Roteiro
(0–3s) [fala literal do gancho]
(3–10s) [fala literal]
(10–25s) [fala literal]
(25–40s) [fala literal]
(40–50s) [fala literal do CTA]

### 💬 On-screen text
- frase curta 1
- frase curta 2

LINGUAGEM E FORMATO ATUAL (vídeo curto 2026):
- Padrão: **Reels / TikTok / Shorts de 15–45s**. Carrossel só quando o briefing pedir explicitamente.
- Ganchos de **0–2s** com pattern interrupt verbal: número específico, afirmação polarizadora, pergunta direta, contraste.
- BANIDO em qualquer fala: "Você sabia que…", "Hoje eu vou te ensinar…", "Fala galera", "bora?", "se inscreve no canal", "deixa o like", "não esqueça de curtir".
- Frases curtas (6–12 palavras), tom coloquial, ritmo rápido, zero jargão de marketing.
- Use formatos atuais quando fizer sentido: POV, storytime de 20s, lista falada com contagem regressiva, reação a comentário, before/after verbal, edutainment.
- CTA de baixa fricção: "comenta X", "salva esse", "manda pra quem precisa". NUNCA "link na bio" como CTA principal.`

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
    } else if (action === 'suggest_improvements') {
      prompt = `Com base no calendário abaixo, forneça sugestões de melhorias estratégicas para o perfil do aluno.
      
Use EXATAMENTE este formato Markdown:

## 🚀 Sugestões de Melhoria de Perfil

### 🕵️ Diagnóstico de Posicionamento
- ...

### 🎨 Melhorias Visuais e de Formato
- ...

### ✍️ Otimização de Bio e Linha Editorial
- ...

### 📈 Ajustes Estratégicos Baseados em Performance
- ...

---

## ✅ 3 Ações Imediatas
1. **...**
2. **...**
3. **...**

CALENDÁRIO ATUAL DO ALUNO:
${calendarSummary}`
    } else if (action === 'performance_analysis') {
      prompt = `Realize uma análise detalhada dos conteúdos publicados no calendário abaixo, identificando o que performou bem e por quê.

Use EXATAMENTE este formato Markdown:

## 📊 Análise de Performance de Conteúdo

### 🏆 Conteúdos de Alta Performance
- **O quê:** ...
- **Por que funcionou:** ...

### 🔁 Padrões Identificados
(Analise ganchos, temas ou formatos que se repetem com sucesso)
- ...

### 📉 O que pode ser evitado ou ajustado
- ...

---

## 💡 Próximos Passos
(Sugira como replicar os sucessos em novos conteúdos)
- ...

CALENDÁRIO ATUAL DO ALUNO:
${calendarSummary}`
    } else if (action === 'rewrite') {
      prompt = `Reescreva o roteiro abaixo aplicando copywriting de alto nível: gancho cirúrgico, ritmo, micro-loops, prova e CTA de baixa fricção. Mantenha o objetivo central.

Use EXATAMENTE este formato:

## ✍️ Roteiro Reescrito

### 🎬 Roteiro
(0–3s) [fala literal do gancho]
(3–10s) [fala literal]
(10–25s) [fala literal]
(25–40s) [fala literal]
(40–50s) [fala literal do CTA]

### 💬 On-screen text
- frase curta 1
- frase curta 2

---

## 🔍 O que mudou e por quê
- **Gancho:** ...
- **Estrutura:** ...
- **Linguagem:** ...
- **CTA:** ...

REGRAS: Só tempo + fala literal. PROIBIDO descrever cena, expressão, postura, gestos, B-roll, trilha ou cortes.

ROTEIRO ORIGINAL:
${content}`
    } else if (action === 'script') {
      prompt = `Crie um roteiro completo de Reels/TikTok sobre o tema abaixo, aplicando copywriting persuasivo.

Use EXATAMENTE este formato:

## 🎬 Roteiro: ${content}

### 🎬 Roteiro
(0–3s) [fala literal do gancho]
(3–10s) [fala literal]
(10–25s) [fala literal]
(25–40s) [fala literal]
(40–50s) [fala literal do CTA]

### 💬 On-screen text
- frase curta 1
- frase curta 2

REGRAS: Só tempo + fala literal. PROIBIDO descrever cena, expressão facial, postura, gestos, B-roll, trilha ou cortes.

TEMA: ${content}

${calendarSummary ? `CONTEXTO (estilo do aluno, somente referência):\n${calendarSummary}` : ""}`
    } else if (action === 'chat') {
      prompt = `Pergunta do usuário:
${content}

Responda em Markdown bem estruturado seguindo as regras de formatação. Comece com um título "##", use "###" para subseções com emojis, e separe blocos com "---".

---
CONTEXTO (calendário do aluno, somente referência):
${calendarSummary}`
    } else if (action === 'inspire_from_post') {
      const s = scraped || {}
      const m = s.metrics || {}
      prompt = `Você recebeu um post de referência (validado por métricas reais). Use o **gancho, estrutura e gatilhos** desse post como inspiração, mas **adapte 100% ao nicho do aluno** detectado no calendário. NUNCA copie literalmente. Reescreva como se fosse do aluno.

POST DE REFERÊNCIA:
- Plataforma: ${s.platform || "?"}
- Autor: @${s.author || "?"}
- Legenda: "${(s.caption || "").slice(0, 800)}"
- Hashtags: ${(s.hashtags || []).slice(0, 15).join(", ") || "—"}
- Música: ${s.music || "—"}
- Duração: ${s.duration || "—"}s
- Métricas: ${m.views || 0} views · ${m.likes || 0} likes · ${m.comments || 0} comentários · ${m.shares || 0} shares

Use EXATAMENTE este formato:

## 💡 Inspirado em post viral

### 🧲 Gancho identificado no original
(1 frase explicando o ângulo que fez funcionar)

### 🎯 Como adaptamos ao seu nicho
(2-3 linhas)

### 📝 Título sugerido
[Título magnético em 1 linha — primeira linha em destaque, será usado como título do post]

### 🎬 Roteiro
(0–3s) [fala literal do gancho adaptado]
(3–10s) [fala literal]
(10–25s) [fala literal]
(25–40s) [fala literal]
(40–50s) [fala literal do CTA]

### 💬 On-screen text
- frase curta 1
- frase curta 2

REGRAS: Roteiro = só tempo + fala literal. PROIBIDO descrever cena, expressão, postura, gestos, B-roll, trilha ou cortes.

CALENDÁRIO DO ALUNO (para detectar nicho e estilo):
${calendarSummary}`
    } else if (action === 'copy_content') {
      const s = scraped || {}
      const m = s.metrics || {}
      const er = m.views > 0 ? (((m.likes || 0) + (m.comments || 0) + (m.shares || 0)) / m.views * 100).toFixed(2) : "—"
      prompt = `Analise estrategicamente este post (validado por métricas reais) e recrie como roteiro adaptado ao nicho do aluno.

POST:
- Plataforma: ${s.platform}
- Autor: @${s.author}
- Legenda: "${(s.caption || "").slice(0, 1200)}"
- Hashtags: ${(s.hashtags || []).slice(0, 20).join(", ") || "—"}
- Música: ${s.music || "—"}
- Duração: ${s.duration || "—"}s
- Métricas: ${m.views || 0} views · ${m.likes || 0} likes · ${m.comments || 0} comentários · ${m.shares || 0} shares · ER ${er}%

Use EXATAMENTE este formato Markdown:

## 📊 Análise de Conteúdo Validado

### 📈 Métricas reais
- **Views:** ${m.views || 0}
- **Likes:** ${m.likes || 0}
- **Comentários:** ${m.comments || 0}
- **Shares:** ${m.shares || 0}
- **Engagement rate:** ${er}%

### 🔍 Por que esse conteúdo funcionou
(3-5 bullets táticos)

---

### ✍️ Análise de copy
- **Gancho:** ...
- **Estrutura:** ...
- **Gatilho psicológico:** ...
- **CTA:** ...

### 🎨 Análise visual / formato
- **Formato:** ...
- **Ritmo (inferido):** ...
- **Padrões visuais prováveis:** ...

### 🧲 Análise de social media
- **Hashtags:** ...
- **Posicionamento do autor:** ...
- **Por que viralizou na plataforma:** ...

---

## 🎬 Roteiro recriado para o seu nicho

### 🎬 Roteiro
(0–3s) [fala literal do gancho adaptado]
(3–10s) [fala literal]
(10–25s) [fala literal]
(25–40s) [fala literal]
(40–50s) [fala literal do CTA]

### 💬 On-screen text
- frase curta 1
- frase curta 2

REGRAS: Roteiro = só tempo + fala literal. PROIBIDO descrever cena, expressão, postura, gestos, B-roll, trilha ou cortes. NUNCA copie literalmente o post original — sempre adapte ao nicho do aluno.

CALENDÁRIO DO ALUNO (para detectar nicho):
${calendarSummary}`
    } else if (action === 'analyze_profile') {
      const s = scraped || {}
      const top = (s.top_posts || []).slice(0, 10).map((p: any, i: number) =>
        `${i + 1}. [${p.views || 0}v · ${p.likes || 0}❤ · ${p.comments || 0}💬] "${(p.caption || "").slice(0, 140)}"`
      ).join("\n")
      prompt = `Analise estrategicamente este perfil de referência/concorrente e tire 3 ideias acionáveis para o aluno.

PERFIL:
- Plataforma: ${s.platform}
- @${s.handle} ${s.verified ? "✓" : ""}
- Nome: ${s.full_name}
- Bio: "${s.bio || "—"}"
- Seguidores: ${s.followers} · Posts: ${s.posts_count}

TOP POSTS RECENTES:
${top || "—"}

Use EXATAMENTE este formato:

## 🕵️ Espionagem de Perfil — @${s.handle}

### 📊 Diagnóstico estratégico
- **Posicionamento:** ...
- **Tom de voz:** ...
- **Formatos dominantes:** ...
- **Padrões de gancho recorrentes:** ...
- **Gatilhos psicológicos mais usados:** ...

### 🏆 O que está funcionando
- ...

### ⚠️ Gaps que o aluno pode explorar
- ...

---

## 💡 3 ideias adaptadas ao seu nicho

### 1. [Título]
**Inspirado em:** ...
**Ângulo adaptado:** ...

### 2. [Título]
**Inspirado em:** ...
**Ângulo adaptado:** ...

### 3. [Título]
**Inspirado em:** ...
**Ângulo adaptado:** ...

CALENDÁRIO DO ALUNO (para adaptar ao nicho):
${calendarSummary}`
    } else if (action === 'analyze_hashtag') {
      const s = scraped || {}
      const top = (s.top_posts || []).slice(0, 12).map((p: any, i: number) =>
        `${i + 1}. @${p.author} [${p.views || 0}v · ${p.likes || 0}❤] "${(p.caption || "").slice(0, 160)}"`
      ).join("\n")
      prompt = `Analise os top posts da hashtag #${s.hashtag} (${s.platform}) e mapeie ângulos vencedores.

TOP POSTS:
${top || "—"}

Use EXATAMENTE este formato:

## 🛰️ Radar de Hashtag — #${s.hashtag}

### 🔁 Ângulos vencedores
- ...

### 🧲 Padrões de gancho recorrentes
- ...

### 🎯 Formatos dominantes
- ...

### ⚠️ Ângulos saturados (evite)
- ...

---

## 💡 3 ideias adaptadas ao seu nicho

### 1. [Título]
**Ângulo:** ...
**Por que funciona aqui:** ...

### 2. [Título]
**Ângulo:** ...
**Por que funciona aqui:** ...

### 3. [Título]
**Ângulo:** ...
**Por que funciona aqui:** ...

CALENDÁRIO DO ALUNO (para adaptar):
${calendarSummary}`
    } else if (action === 'analyze_comments') {
      const s = scraped || {}
      const list = (s.comments || []).slice(0, 30).map((c: any, i: number) =>
        `${i + 1}. [${c.likes || 0}❤] @${c.author}: ${(c.text || "").slice(0, 200)}`
      ).join("\n")
      prompt = `Analise os comentários abaixo (post real, ${s.platform}) e extraia dores, objeções, linguagem nativa do público e ganchos prontos.

COMENTÁRIOS:
${list || "—"}

Use EXATAMENTE este formato:

## 💬 Decifrando Comentários

### 😣 Dores e objeções recorrentes
- ...

### 🗣️ Linguagem nativa do público
(palavras/expressões exatas usadas — para reaproveitar em copy)
- ...

### ❓ Perguntas/dúvidas mais frequentes
- ...

### 🎯 Sentimento geral
(1-2 linhas)

---

## 🧲 3 ganchos prontos derivados desses comentários

### 1. [Gancho literal — uma frase de 6-12 palavras]
**Por quê:** ...

### 2. [Gancho literal]
**Por quê:** ...

### 3. [Gancho literal]
**Por quê:** ...

CALENDÁRIO DO ALUNO (para adaptar):
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
