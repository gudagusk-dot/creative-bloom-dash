import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Send, Loader2, BrainCircuit, Lightbulb, Wand2, BarChart3, ArrowLeft, Video, LayoutGrid, Layers } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  open: boolean;
  onClose: () => void;
  studentName?: string;
}

type ChatMsg = { role: "user" | "assistant"; content: string };
type Step = "menu" | "briefing" | "chat";
type FormatChoice = "video" | "carrossel" | "ambos";

const QUICK_ACTIONS = [
  { id: "analyze", label: "Analisar calendário", icon: BarChart3, hint: "Padrões, tom de voz, lacunas e ajustes táticos." },
  { id: "suggest", label: "Sugerir 3 ideias", icon: Lightbulb, hint: "Briefing rápido + 3 ideias com gancho e estrutura." },
  { id: "rewrite", label: "Melhorar último roteiro", icon: Wand2, hint: "Reescreve o post mais recente com copy de elite." },
] as const;

const FORMAT_OPTIONS: { id: FormatChoice; label: string; hint: string; icon: typeof Video }[] = [
  { id: "video", label: "Vídeo (Reels / TikTok)", hint: "Formato vertical curto, 15-60s.", icon: Video },
  { id: "carrossel", label: "Carrossel (Instagram)", hint: "6-10 slides estáticos.", icon: LayoutGrid },
  { id: "ambos", label: "Misto", hint: "Brenda escolhe o melhor formato por ideia.", icon: Layers },
];

export const CoachDialog = ({ open, onClose, studentName }: Props) => {
  const { posts } = useContent();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [briefingFormat, setBriefingFormat] = useState<FormatChoice | null>(null);
  const [briefingTheme, setBriefingTheme] = useState("");

  if (!open) return null;

  const buildPostsContext = () =>
    posts.slice(0, 30).map(p => ({
      title: p.title,
      category: p.category,
      format: p.format,
      network: p.network,
      status: p.status,
      script: p.script,
    }));

  const callBrenda = async (action: string, content: string, userLabel: string, extra?: Record<string, any>) => {
    setLoading(true);
    setStep("chat");
    setMessages(prev => [...prev, { role: "user", content: userLabel }]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-content-coach", {
        body: { action, content, posts_context: buildPostsContext(), ...(extra || {}) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data?.text || "Sem resposta." }]);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao consultar a Brenda IA");
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e?.message || "Erro ao gerar resposta."}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onQuickAction = (id: string) => {
    if (id === "analyze") callBrenda("analyze", "", "Analisar calendário deste aluno.");
    else if (id === "suggest") {
      setBriefingFormat(null);
      setBriefingTheme("");
      setStep("briefing");
    } else if (id === "rewrite") {
      const last = posts[0];
      if (!last?.script || last.script === "<p></p>") {
        toast.error("Nenhum roteiro disponível para reescrever.");
        return;
      }
      const plain = last.script.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      callBrenda("rewrite", plain, `Melhorar o roteiro de "${last.title}".`);
    }
  };

  const submitBriefing = () => {
    if (!briefingFormat) return;
    const labelFmt = FORMAT_OPTIONS.find(f => f.id === briefingFormat)?.label;
    const userLabel = `Briefing → Formato: **${labelFmt}**${briefingTheme.trim() ? `\nTema/objetivo: ${briefingTheme.trim()}` : ""}`;
    callBrenda("suggest", "", userLabel, { format: briefingFormat, theme: briefingTheme.trim() || undefined });
  };

  const onSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    callBrenda("chat", text, text);
  };

  const goBackToMenu = () => {
    setMessages([]);
    setStep("menu");
    setBriefingFormat(null);
    setBriefingTheme("");
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-card border-l border-border/60 shadow-soft-xl z-[61] animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3 min-w-0">
            {step !== "menu" && (
              <button
                onClick={goBackToMenu}
                title="Voltar ao menu"
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft shrink-0">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground tracking-tight truncate">Brenda IA</h2>
              <p className="text-[11px] text-muted-foreground truncate">{studentName ? `Calendário de ${studentName}` : "Estrategista de conteúdo"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {step === "menu" && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">Ações rápidas</p>
            <div className="grid grid-cols-1 gap-2.5">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => onQuickAction(a.id)}
                  disabled={loading}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0 group-hover:from-primary/25 group-hover:to-accent/25 transition-colors">
                    <a.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{a.hint}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic mt-5 text-center">
              {posts.length} post(s) carregados como contexto.
            </p>
          </div>
        )}

        {step === "briefing" && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-5 pb-4">
            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/15 p-4 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">Briefing rápido</p>
              <h3 className="font-display text-lg font-semibold text-foreground tracking-tight">Vamos afiar as 3 ideias 🎯</h3>
              <p className="text-xs text-muted-foreground mt-1">Antes de gerar, me diga em qual formato você quer focar e (opcional) algum tema/objetivo.</p>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">1. Formato</p>
            <div className="grid grid-cols-1 gap-2 mb-5">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBriefingFormat(opt.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    briefingFormat === opt.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    briefingFormat === opt.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                    <opt.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">2. Tema ou objetivo (opcional)</p>
            <textarea
              value={briefingTheme}
              onChange={e => setBriefingTheme(e.target.value)}
              placeholder='Ex.: "focar em pronúncia para iniciantes" ou "atrair leads para a turma de fevereiro"'
              rows={3}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:outline-none mb-4"
            />

            <button
              onClick={submitBriefing}
              disabled={!briefingFormat || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Sparkles className="h-4 w-4" /> Gerar 3 ideias
            </button>
          </div>
        )}

        {step === "chat" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`${m.role === "user" ? "max-w-[85%]" : "max-w-[97%] w-full"} px-4 py-3 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary/60 text-foreground rounded-bl-sm border border-border/60"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none
                      prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground
                      prose-h2:text-[18px] prose-h2:font-bold prose-h2:mt-2 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
                      prose-h3:text-[15px] prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1.5
                      prose-p:my-1.5 prose-p:leading-relaxed
                      prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-md prose-blockquote:not-italic prose-blockquote:text-foreground prose-blockquote:my-2
                      prose-hr:my-5 prose-hr:border-border">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Brenda está pensando…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer / input */}
        {step === "chat" && (
          <div className="p-3 sm:p-4 border-t border-border/60">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder="Pergunte algo, peça ideias, peça um roteiro..."
                rows={2}
                className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:outline-none"
              />
              <button
                onClick={onSend}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground disabled:opacity-50 hover:-translate-y-0.5 transition-all shadow-soft"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Brenda IA · powered by Lovable AI
            </p>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
