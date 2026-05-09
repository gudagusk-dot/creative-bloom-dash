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

    const systemPrompt = `Você é um Social Media Strategist e Copywriter sênior, especialista em Instagram e TikTok para o nicho de ensino de inglês. Suas respostas devem ser concretas, em português do Brasil, com bullets, e sempre acionáveis. Quando sugerir ideias, traga: gancho, formato sugerido, categoria e CTA.`

    let prompt = ""
    if (action === 'analyze') {
      prompt = `Analise o calendário de conteúdo abaixo. Identifique padrões, temas recorrentes, o tom de voz, pontos fortes e lacunas. Sugira 3 ajustes táticos no fim.\n\nCALENDÁRIO:\n${calendarSummary}`
    } else if (action === 'suggest') {
      prompt = `Com base no calendário abaixo, gere 5 novas ideias criativas e estratégicas de posts que conversem com o histórico do aluno mas tragam variedade. Para cada ideia: título, gancho, formato, categoria e CTA.\n\nCALENDÁRIO:\n${calendarSummary}`
    } else if (action === 'rewrite') {
      prompt = `Reescreva o roteiro abaixo tornando-o mais persuasivo, com gancho forte, ritmo dinâmico e CTA claro. Mantenha o objetivo central.\n\nROTEIRO:\n${content}`
    } else if (action === 'script') {
      prompt = `Crie um roteiro completo (gancho + desenvolvimento + CTA) para um Reels/TikTok sobre o tema abaixo. Inclua sugestões de corte e on-screen text.\n\nTEMA: ${content}\n\n${calendarSummary ? `CONTEXTO (estilo do aluno):\n${calendarSummary}` : ""}`
    } else if (action === 'chat') {
      prompt = `${content}\n\n---\nCONTEXTO (calendário do aluno, somente referência):\n${calendarSummary}`
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
