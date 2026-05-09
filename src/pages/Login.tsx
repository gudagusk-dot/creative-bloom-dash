import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@/assets/login-hero.jpg";

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
    <div className="relative min-h-screen w-full bg-background grid lg:grid-cols-[1.05fr_1fr]">
      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle />
      </div>

      {/* Left — cinematic hero */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative hidden lg:block overflow-hidden"
      >
        <img
          src={heroImage}
          alt="Céu cinematográfico ao entardecer"
          width={1024}
          height={1280}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        {/* Editorial copy */}
        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[10.5px] font-medium tracking-[0.32em] text-white/85 uppercase"
            style={{ fontVariant: "small-caps" }}
          >
            Plano de Conteúdo<span className="align-super text-[8px] ml-0.5">®</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <p
              className="text-display-italic text-white text-4xl xl:text-5xl leading-[1.1] tracking-tight"
              style={{ fontWeight: 300 }}
            >
              Cada conteúdo,
              <br />
              uma <span className="not-italic font-light">história</span> para contar.
            </p>
            <p className="mt-5 text-sm text-white/70 max-w-md leading-relaxed font-sans">
              Um planejamento editorial pensado para criadoras que querem clareza, ritmo e presença.
            </p>
          </motion.div>
        </div>
      </motion.aside>

      {/* Right — form */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 relative"
      >
        {/* Mobile mini-hero */}
        <div className="lg:hidden relative h-44 -mx-6 sm:-mx-10 mb-10 overflow-hidden">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          <div className="relative z-10 h-full flex items-end p-6">
            <span
              className="text-[10px] font-medium tracking-[0.3em] text-white uppercase"
              style={{ fontVariant: "small-caps" }}
            >
              Plano de Conteúdo<span className="align-super text-[7px] ml-0.5">®</span>
            </span>
          </div>
        </div>

        <div className="w-full max-w-[400px] mx-auto">
          <span className="block text-[10.5px] font-medium tracking-[0.28em] text-muted-foreground uppercase mb-5">
            Bem-vinda
          </span>
          <h1
            className="text-display-italic text-foreground text-[44px] sm:text-[52px] leading-[1.02] tracking-tight"
            style={{ fontWeight: 300 }}
          >
            Bem-vinda
            <br />
            de <span className="not-italic font-light">volta.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Acesse seu calendário com seu nome.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="block text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase mb-2">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoFocus
                className="w-full bg-transparent border-0 border-b border-border focus:border-foreground rounded-none px-0 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 transition-colors duration-300 font-sans"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="group w-full h-12 rounded-full bg-foreground text-background text-[13px] font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <span>{loading ? "Entrando..." : "Continuar"}</span>
              {!loading && (
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
              )}
            </button>
          </form>

          <p className="mt-12 text-[11px] text-muted-foreground/70 text-center tracking-wide">
            feito com carinho para minha gatinha · por gustavo
          </p>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} · Plano de Conteúdo
        </div>
      </motion.section>
    </div>
  );
};

export default Login;
