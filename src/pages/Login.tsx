import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { CalendarDays, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const Login = () => {
  const { login } = useUser();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(name);
    } catch (err: any) {
      setError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Visual side */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-hero text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary-glow/30 blur-3xl" />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium tracking-wide opacity-90">Plano de Conteúdo</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Planejamento estratégico
          </div>
          <h2 className="font-display text-5xl xl:text-6xl font-light leading-[1.05] tracking-tight">
            Organize cada<br />
            <span className="italic font-normal">conteúdo</span> com<br />
            clareza editorial.
          </h2>
          <p className="mt-6 text-base text-white/75 max-w-md leading-relaxed">
            Crie calendários dedicados para cada aluno, acompanhe o progresso em tempo real e entregue resultado.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10 text-xs text-white/50"
        >
          © {new Date().getFullYear()} · Todos os direitos reservados
        </motion.div>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary mb-6 shadow-soft-md">
              <CalendarDays className="h-7 w-7 text-primary-foreground" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-light text-foreground leading-tight">
              Bem-vindo<span className="text-primary">.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com seu nome para acessar seus calendários.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Seu nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como devemos te chamar?"
                  className="w-full mt-2 px-4 py-3.5 rounded-xl border border-border bg-card text-foreground text-base focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none transition-all ease-soft"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-3.5 bg-gradient-primary text-primary-foreground rounded-xl font-medium text-sm shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all ease-soft disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? "Entrando..." : "Entrar →"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
