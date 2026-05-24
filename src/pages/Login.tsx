import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

const Login = () => {
  const { login } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(name, email);
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

      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_SVG }}
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
            <CalendarDays className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <span
            className="text-[11px] font-medium tracking-[0.32em] uppercase text-white/90"
            style={{ fontVariant: "small-caps" }}
          >
            Plano de Conteúdo<span className="align-super text-[8px] ml-0.5">®</span>
          </span>
        </motion.div>
        <ThemeToggle />
      </div>

      {/* Centered dark card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[440px] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(40,15,60,0.65)] ring-1 ring-white/10"
          style={{ backgroundColor: "#1a1322" }}
        >
          {/* Inner grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
            style={{ backgroundImage: GRAIN_SVG }}
          />
          {/* Soft top glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[22rem] h-[22rem] rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(236,160,200,0.35), transparent 70%)" }}
          />

          <div className="relative px-7 sm:px-10 pt-12 pb-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[10px] font-medium text-white/85 uppercase tracking-[0.18em] mb-9">
              <Sparkles className="h-3 w-3" /> Bem-vinda
            </div>

            <h1
              className="text-display-italic text-white text-[34px] sm:text-[40px] leading-[1.15] tracking-tight"
              style={{ fontWeight: 300 }}
            >
              Cada conteúdo,
              <br />
              <span className="not-italic font-light">uma história</span>
              <br />
              para contar.
            </h1>
            <p className="mt-7 text-[13px] text-white/65 leading-relaxed max-w-[36ch] font-sans">
              Um planejamento editorial pensado para criadoras que querem clareza, ritmo e presença.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoFocus
                className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3 text-[14px] text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-0 transition-all duration-300 font-sans"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail para notificações (opcional)"
                className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3 text-[14px] text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-0 transition-all duration-300 font-sans"
              />

              {error && (
                <p className="text-xs text-rose-300/90 px-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="group w-full h-12 rounded-full bg-white text-[#1a1322] text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/95 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(255,200,220,0.55)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span>{loading ? "Entrando..." : "Entrar no calendário"}</span>
                {!loading && (
                  <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                )}
              </button>
            </form>

            {/* Footer line */}
            <div className="mt-10 pt-5 border-t border-white/10 flex items-center justify-center text-[10px] text-white/45 tracking-[0.22em] uppercase">
              <span className="flex items-center gap-2">
                <span>conteúdo</span>
                <span className="text-white/25">+</span>
                <span>ritmo</span>
                <span className="text-white/25">+</span>
                <span>presença</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center space-y-1">
        <p className="text-[11px] text-white/70 tracking-wide">
          feito com carinho para minha gatinha 💗 por gustavo
        </p>
        <p className="text-[10px] text-white/45 tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} · Plano de Conteúdo
        </p>
      </div>
    </div>
  );
};

export default Login;
