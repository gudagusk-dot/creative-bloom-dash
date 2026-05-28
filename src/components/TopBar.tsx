import { CalendarDays, LogOut, Share2, Activity, ArrowLeft, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "@/context/ContentContext";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import { ShareDialog } from "./ShareDialog";
import { ProgressPanel } from "./ProgressPanel";
import { ThemeToggle } from "./ThemeToggle";
import { Student } from "@/context/StudentsContext";
import { NewCategoryPopover } from "./NewCategoryPopover";
import { ManageCategoriesDialog } from "./ManageCategoriesDialog";
import { NotificationSettings } from "./NotificationSettings";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  viewMode: "admin" | "student";
  student?: Student | null;
}

export const TopBar = ({ viewMode, student }: Props) => {
  const { networkFilter, setNetworkFilter, selectedCategories, toggleCategory, studentId, categories } = useContent();
  const { userName, notificationEmail, logout } = useUser();
  const [shareOpen, setShareOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);


  return (
    <div className="border-b border-border/60 bg-card/90 backdrop-blur sticky top-0 z-30">
      {/* Top row */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {viewMode === "admin" && (
            <Link to="/" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="Voltar para alunos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 shadow-soft">
            <CalendarDays className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base sm:text-lg font-medium text-foreground truncate tracking-tight">
            {student?.name || "Plano de Conteúdo"}
          </span>
          {viewMode === "student" && (
            <span className="hidden sm:inline text-[11px] text-muted-foreground ml-1 px-2 py-0.5 rounded-full bg-secondary truncate">Modo aluno</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "admin" && <NotificationSettings />}
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
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all ease-soft"
                title="Compartilhar com aluno"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
            </>
          )}

          {viewMode === "admin" && userName && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 ml-1 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Perfil"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center ring-2 ring-background shadow-soft">
                    <span className="font-display text-sm font-medium text-primary-foreground">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{userName}</span>
                    {notificationEmail && (
                      <span className="text-xs text-muted-foreground truncate">{notificationEmail}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setConfirmLogoutOpen(true);
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}


          {viewMode === "student" && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Aluno</span>
          )}
        </div>
      </div>

      {/* Filters row — only for admin */}
      {viewMode === "admin" && (
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pb-3 border-t border-border/40 pt-2.5">
          <div className="flex gap-1.5">
            {(["all", "Instagram", "TikTok"] as const).map(n => (
              <button
                key={n}
                onClick={() => setNetworkFilter(n)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ease-soft ${
                  networkFilter === n
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {n === "all" ? "Todas" : n}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border/60 mx-1" />
          <div className="flex flex-wrap gap-1.5 items-center">
            {categories.length === 0 && (
              <span className="text-[11px] text-muted-foreground italic">Sem categorias ainda</span>
            )}
            {categories.map(cat => {
              const active = selectedCategories.includes(cat.name);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.name)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ease-soft border flex items-center ${
                    active ? "border-transparent text-white shadow-soft" : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                  style={active ? { backgroundColor: cat.color } : {}}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              );
            })}
            <button
              onClick={() => setManageOpen(true)}
              className="ml-1 p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
              title="Gerenciar categorias"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {viewMode === "admin" && (
        <ManageCategoriesDialog open={manageOpen} onClose={() => setManageOpen(false)} />
      )}
      {viewMode === "admin" && student && (
        <>
          <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} student={student} />
          {studentId && <ProgressPanel open={progressOpen} onClose={() => setProgressOpen(false)} studentId={studentId} />}
        </>
      )}
      <AlertDialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja sair da sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisará fazer login novamente para acessar seus calendários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
};
