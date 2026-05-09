import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { CalendarDays, ArrowRight } from "lucide-react";
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
    } catch {
      setError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Subtle radial halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 35%, hsl(var(--primary) / 0.08), transparent 70%)",
        }}
      />
      {/* Grain texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-end p-4 sm:p-6">
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px] flex flex-col items-center"
        >
          {/* Brand mark */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-10 h-10 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm flex items-center justify-center">
              <CalendarDays className="h-4.5 w-4.5 text-foreground/80" strokeWidth={1.75} />
            </div>
            <span className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
              Plano de Conteúdo
            </span>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground tracking-tight leading-[1.1]">
              Bem-vindo de volta
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Entre com seu nome para continuar.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full mt-12 space-y-6">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoFocus
                className="w-full bg-transparent border-0 border-b border-border/80 px-0 py-3.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none focus:ring-0 transition-colors duration-300"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="group w-full h-12 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Entrando..." : "Continuar"}</span>
              {!loading && (
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-[11px] text-muted-foreground/60 tracking-wide">
          © {new Date().getFullYear()} · Plano de Conteúdo
        </p>
      </div>
    </div>
  );
};

export default Login;
