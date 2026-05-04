import { CalendarDays, LogOut, Share2, Activity, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "@/context/ContentContext";
import { useUser } from "@/context/UserContext";
import { categoryConfig, Category } from "@/data/content";
import { useState } from "react";
import { ShareDialog } from "./ShareDialog";
import { ProgressPanel } from "./ProgressPanel";
import { ThemeToggle } from "./ThemeToggle";
import { Student } from "@/context/StudentsContext";

const categories = Object.keys(categoryConfig) as Category[];

interface Props {
  viewMode: "admin" | "student";
  student?: Student | null;
}

export const TopBar = ({ viewMode, student }: Props) => {
  const { networkFilter, setNetworkFilter, selectedCategories, toggleCategory, studentId } = useContent();
  const { userName, logout } = useUser();
  const [shareOpen, setShareOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  return (
    <div className="border-b border-border bg-card">
      {/* Top row */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {viewMode === "admin" && (
            <Link to="/" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" title="Voltar para alunos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
          <span className="text-sm sm:text-lg font-semibold text-foreground truncate">
            {student?.name || "Plano de Conteúdo"}
          </span>
          {viewMode === "student" && (
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2 truncate">· Modo aluno</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {viewMode === "admin" && student && (
            <>
              <button
                onClick={() => setProgressOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                title="Progresso do aluno"
              >
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Progresso</span>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                title="Compartilhar com aluno"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
            </>
          )}

          {viewMode === "admin" && userName && (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <button onClick={logout} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {viewMode === "student" && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Aluno</span>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pb-3 border-t border-border/50 pt-2">
        <div className="flex gap-1.5">
          {(["all", "Instagram", "TikTok"] as const).map(n => (
            <button
              key={n}
              onClick={() => setNetworkFilter(n)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                networkFilter === n
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {n === "all" ? "Todas" : n}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => {
            const active = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all border flex items-center ${
                  active ? "border-transparent text-white" : "border-border text-muted-foreground hover:border-foreground/20"
                }`}
                style={active ? { backgroundColor: categoryConfig[cat].color } : {}}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: categoryConfig[cat].color }} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>
      {viewMode === "admin" && student && (
        <>
          <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} student={student} />
          {studentId && <ProgressPanel open={progressOpen} onClose={() => setProgressOpen(false)} studentId={studentId} />}
        </>
      )}
    </div>
  );
};
