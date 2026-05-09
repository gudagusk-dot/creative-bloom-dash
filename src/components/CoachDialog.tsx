import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Send, Loader2, BrainCircuit, Lightbulb, Wand2, BarChart3 } from "lucide-react";
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

const QUICK_ACTIONS = [
  { id: "analyze", label: "Analisar calendário", icon: BarChart3, hint: "Padrões, tom de voz, lacunas." },
  { id: "suggest", label: "Sugerir 3 ideias", icon: Lightbulb, hint: "Novos posts baseados no histórico." },
  { id: "rewrite", label: "Melhorar último roteiro", icon: Wand2, hint: "Reescreve o post mais recente." },
] as const;

export const CoachDialog = ({ open, onClose, studentName }: Props) => {
  const { posts } = useContent();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

  const callCoach = async (action: string, content: string, userLabel: string) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", content: userLabel }]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-content-coach", {
        body: { action, content, posts_context: buildPostsContext() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data?.text || "Sem resposta." }]);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao consultar o Coach IA");
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e?.message || "Erro ao gerar resposta."}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onQuickAction = (id: string) => {
    if (id === "analyze") callCoach("analyze", "", "Analise o calendário deste aluno.");
    else if (id === "suggest") callCoach("suggest", "", "Sugira 5 novas ideias de conteúdo.");
    else if (id === "rewrite") {
      const last = posts[0];
      if (!last?.script || last.script === "<p></p>") {
        toast.error("Nenhum roteiro disponível para reescrever.");
        return;
      }
      const plain = last.script.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      callCoach("rewrite", plain, `Melhore o roteiro de "${last.title}".`);
    }
  };

  const onSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    callCoach("chat", text, text);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[560px] bg-card border-l border-border/60 shadow-soft-xl z-[61] animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-medium text-foreground tracking-tight">Coach IA</h2>
              <p className="text-[11px] text-muted-foreground">{studentName ? `Calendário de ${studentName}` : "Assistente de conteúdo"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {messages.length === 0 && (
          <div className="px-4 sm:px-5 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Ações rápidas</p>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => onQuickAction(a.id)}
                  disabled={loading}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <a.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground">{a.hint}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic mt-4 text-center">
              {posts.length} post(s) carregados como contexto.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:mt-2 prose-headings:mb-1 prose-strong:text-foreground">
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
                <span className="text-xs text-muted-foreground">Pensando…</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-border/60">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder="Pergunte algo sobre o calendário, peça ideias, peça um roteiro..."
              rows={2}
              className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <button
              onClick={onSend}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-primary text-primary-foreground disabled:opacity-50 hover:-translate-y-0.5 transition-all shadow-soft"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Powered by Lovable AI
          </p>
        </div>
      </div>
    </>,
    document.body
  );
};
