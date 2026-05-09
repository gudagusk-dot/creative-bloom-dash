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
    const { action, content, context, posts_context, model: modelOverride } = await req.json()
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

    const systemPrompt = `Você é um Social Media Strategist e Copywriter sênior, especialista em Instagram e TikTok para o nicho de ensino de inglês.

REGRAS DE FORMATAÇÃO (OBRIGATÓRIAS):
- Responda SEMPRE em português do Brasil, em Markdown bem estruturado.
- Use títulos com "##" para cada ideia/seção e "###" para subseções.
- Separe CADA ideia com uma linha "---" (regra horizontal).
- NUNCA misture ideias diferentes em um mesmo parágrafo.
- Use listas com "-" e **negrito** para destacar campos.
- Quando trouxer um roteiro, separe nitidamente em blocos: **Gancho**, **Desenvolvimento**, **CTA**, **On-screen text**, **Sugestões de corte**.
- Seja conciso, acionável e evite enrolação.`

    let prompt = ""
    if (action === 'analyze') {
      prompt = `Analise o calendário de conteúdo abaixo.

Estruture a resposta EXATAMENTE neste formato Markdown:

## 📊 Visão geral
(2-3 linhas)

## 🎯 Tom de voz
- ...

## 🔁 Temas recorrentes
- ...

## ✅ Pontos fortes
- ...

## ⚠️ Lacunas
- ...

## 🚀 3 ajustes táticos
1. ...
2. ...
3. ...

CALENDÁRIO:
${calendarSummary}`
    } else if (action === 'suggest') {
      prompt = `Com base no calendário abaixo, gere **5 novas ideias** de posts criativas e estratégicas, alinhadas ao estilo do aluno mas trazendo variedade.

Para CADA ideia, use EXATAMENTE este template Markdown e separe as ideias com "---":

## Ideia N — [Título do post]

- **Gancho:** ...
- **Formato:** (Reels / Carrossel / Story / etc.)
- **Categoria:** ...
- **Plataforma:** (Instagram / TikTok)
- **Estrutura sugerida:**
  1. ...
  2. ...
  3. ...
- **CTA:** ...

---

Não misture ideias. Não adicione introdução longa antes da primeira ideia.

CALENDÁRIO:
${calendarSummary}`
    } else if (action === 'rewrite') {
      prompt = `Reescreva o roteiro abaixo tornando-o mais persuasivo, com gancho forte, ritmo dinâmico e CTA claro. Mantenha o objetivo central.

Estruture a resposta EXATAMENTE assim:

## ✍️ Roteiro reescrito

### 🎣 Gancho (0-3s)
...

### 🎬 Desenvolvimento
...

### 📢 CTA
...

### 💬 On-screen text
- ...

### 🎞️ Sugestões de corte
- ...

---

## 🔍 O que mudou e por quê
- ...

ROTEIRO ORIGINAL:
${content}`
    } else if (action === 'script') {
      prompt = `Crie um roteiro completo para Reels/TikTok sobre o tema abaixo.

Estruture EXATAMENTE assim:

## 🎬 Roteiro: ${content}

### 🎣 Gancho (0-3s)
...

### 🎬 Desenvolvimento
...

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

Responda em Markdown bem estruturado, com títulos "##", listas e separadores "---" quando trouxer múltiplos itens. Não misture tópicos em um mesmo parágrafo.

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
      console.error("[ai-coach] gateway error", response.status, errText)
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
    console.error("[ai-coach] unhandled", error)
    return new Response(JSON.stringify({ error: error.message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
