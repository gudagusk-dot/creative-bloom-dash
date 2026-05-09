import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@/assets/login-hero.jpg";
import bgImage from "@/assets/login-bg.jpg";

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 sm:px-8 py-10">
      {/* Background sky */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Soft pink wash to unify */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,210,225,0.25) 0%, rgba(190,160,210,0.20) 60%, rgba(120,90,150,0.35) 100%)",
        }}
      />
      {/* Global grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_SVG }}
      />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle />
      </div>

      {/* Top brand */}
      <div className="absolute top-6 left-6 z-30">
        <span
          className="text-[10px] font-medium tracking-[0.34em] uppercase text-white/90 drop-shadow-[0_1px_8px_rgba(80,40,90,0.5)]"
          style={{ fontVariant: "small-caps" }}
        >
          Plano de Conteúdo<span className="align-super text-[7px] ml-0.5">®</span>
        </span>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(80,30,90,0.55)] ring-1 ring-white/10"
        style={{ backgroundColor: "#1a1322" }}
      >
        {/* Top: artwork */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <img
            src={heroImage}
            alt="Campo de flores ao entardecer"
            width={832}
            height={1216}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Bottom fade into card */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background:
                "linear-gradient(180deg, rgba(26,19,34,0) 0%, rgba(26,19,34,0.6) 60%, #1a1322 100%)",
            }}
          />
          {/* Top tagline */}
          <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
            <span
              className="text-display-italic text-white/95 text-[15px] tracking-tight"
              style={{ fontWeight: 400 }}
            >
              Trabalhe leve. Crie devagar.
            </span>
          </div>
          {/* Grain on top of image */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.22] mix-blend-overlay"
            style={{ backgroundImage: GRAIN_SVG }}
          />
        </div>

        {/* Bottom: content */}
        <div className="relative px-7 sm:px-9 pt-2 pb-7">
          <h1
            className="text-display-italic text-white text-[34px] sm:text-[38px] leading-[1.05] tracking-tight"
            style={{ fontWeight: 300 }}
          >
            Crie sua próxima
            <br />
            <span className="not-italic font-light">história.</span>
          </h1>
          <p className="mt-3 text-[13px] text-white/65 leading-relaxed font-sans max-w-[34ch]">
            Um planejamento editorial pensado para criadoras que querem clareza, ritmo e presença.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              autoFocus
              className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3 text-[14px] text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none focus:ring-0 transition-all duration-300 font-sans"
            />

            {error && (
              <p className="text-xs text-rose-300/90 px-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="group w-full h-12 rounded-full bg-white text-[#1a1322] text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/95 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(255,200,220,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <span>{loading ? "Entrando..." : "Entrar no calendário"}</span>
              {!loading && (
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
              )}
            </button>
          </form>

          {/* Footer line inside card */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10.5px] text-white/45 tracking-[0.2em] uppercase">
            <span>seu.nome</span>
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

      {/* Bottom signature */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10.5px] text-white/70 tracking-wide z-10 drop-shadow-[0_1px_6px_rgba(80,40,90,0.5)]">
        feito com carinho para minha gatinha · por gustavo
      </div>
    </div>
  );
};

export default Login;
