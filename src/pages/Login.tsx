import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { CalendarDays, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col bg-gradient-hero">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-40 w-[32rem] h-[32rem] rounded-full bg-pink-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-primary-glow/20 blur-3xl" />

      {/* Grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Grain texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <CalendarDays className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium tracking-wide text-white/85">Plano de Conteúdo</span>
        </motion.div>
        <ThemeToggle />
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Glass card */}
          <div className="relative rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.4)] p-8 sm:p-10">
            {/* Inner highlight */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 40%)",
              }}
            />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-[10px] font-medium text-white/90 uppercase tracking-[0.14em] mb-5">
                <Sparkles className="h-3 w-3" /> Bem-vindo
              </div>

              <h1 className="font-display text-3xl sm:text-[34px] font-light text-white tracking-tight leading-[1.1]">
                Organize cada<br />
                <span className="italic font-normal">conteúdo</span> com clareza.
              </h1>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                Entre com seu nome para acessar seus calendários.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoFocus
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-base text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/10 focus:outline-none focus:ring-0 transition-all duration-300"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-200 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="group w-full h-12 rounded-xl bg-white text-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/95 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span>{loading ? "Entrando..." : "Continuar"}</span>
                  {!loading && (
                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                  )}
                </button>
              </form>
            </div>
          </div>
          {/* Personal note */}
          <p className="font-sans font-medium text-[11px] text-white text-center mt-3 tracking-[0.14em] uppercase">
            feito com carinho para minha gatinha 💙 por gustavo
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-[11px] text-white/50 tracking-wide">
          © {new Date().getFullYear()} · Plano de Conteúdo
        </p>
      </div>
    </div>
  );
};

export default Login;
