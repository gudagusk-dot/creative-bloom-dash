import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useStudents, Student } from "@/context/StudentsContext";
import { CalendarDays, LogOut, Plus, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { StudentCard } from "@/components/StudentCard";
import { NewStudentDialog } from "@/components/NewStudentDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { EditStudentDialog } from "@/components/EditStudentDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationSettings } from "@/components/NotificationSettings";
import { AlertCircle, X, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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


import { useStudentsStats } from "@/hooks/useStudentsStats";

const StudentsDashboard = () => {
  const { userName, notificationEmail, logout } = useUser();
  const { students, loading, deleteStudent } = useStudents();
  const { stats } = useStudentsStats(students.map(s => s.id));
  const [newOpen, setNewOpen] = useState(false);
  const [shareStudent, setShareStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);


  const handleDelete = async (s: Student) => {
    if (!confirm(`Excluir o calendário de ${s.name}? Todos os conteúdos serão removidos.`)) return;
    await deleteStudent(s.id);
  };

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-50" />
      <header className="border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-30 relative">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-soft">
              <CalendarDays className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base sm:text-lg font-medium text-foreground truncate tracking-tight">
              Plano de Conteúdo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {userName && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 ml-1 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Perfil"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center ring-2 ring-background shadow-soft">
                      <span className="font-display text-sm font-medium text-primary-foreground">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="hidden sm:inline text-xs font-medium text-foreground pr-1">{userName}</span>
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
          </div>
        </div>
      </header>

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


      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {userName && !notificationEmail && showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8 overflow-hidden"
          >
            <Alert className="bg-primary/5 border-primary/20 relative group pr-12">
              <Bell className="h-5 w-5 text-primary animate-pulse" />
              <AlertTitle className="text-primary font-display font-medium">Ative as Notificações!</AlertTitle>
              <AlertDescription className="text-muted-foreground pr-4">
                Configure seu e-mail para ser avisado sempre que seus alunos subirem novos conteúdos ou atualizarem tarefas.
              </AlertDescription>
              <div className="mt-3 flex items-center gap-3">
                <NotificationSettings />
                <Button variant="ghost" size="sm" onClick={() => setShowBanner(false)} className="text-muted-foreground">
                  Lembrar depois
                </Button>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-2">
              Olá{userName ? `, ${userName}` : ""}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-light text-foreground tracking-tight flex items-center gap-4">
              <span className="text-display-italic">Seus</span> clientes
              <span className="text-sm font-sans font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full align-middle">
                {students.length}
              </span>
            </h1>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-primary text-primary-foreground rounded-xl text-sm font-medium shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all ease-soft"
          >
            <Plus className="h-4 w-4" /> Novo calendário
          </button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-card border border-border/60 animate-soft-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-dashed border-border bg-card/50 p-12 sm:p-16 text-center overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cat-destrave/5 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary text-primary-foreground mb-5 shadow-soft-md">
                <Users className="h-7 w-7" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-2 tracking-tight">
                Comece criando seu<br className="hidden sm:block" /> primeiro calendário
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-7">
                Cadastre um aluno e organize todo o conteúdo dele em um calendário visual e dedicado.
              </p>
              <button
                onClick={() => setNewOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-primary-foreground rounded-xl text-sm font-medium shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all ease-soft"
              >
                <Sparkles className="h-4 w-4" /> Criar primeiro calendário
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {students.map(s => (
              <motion.div
                key={s.id}
                className="h-full"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <StudentCard student={s} stats={stats[s.id]} onShare={setShareStudent} onDelete={handleDelete} onEdit={setEditStudent} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <NewStudentDialog open={newOpen} onClose={() => setNewOpen(false)} />
      {shareStudent && (
        <ShareDialog open={!!shareStudent} onClose={() => setShareStudent(null)} student={shareStudent} />
      )}
      {editStudent && (
        <EditStudentDialog open={!!editStudent} onClose={() => setEditStudent(null)} student={editStudent} />
      )}
      <GlobalSearch />
    </div>
  );
};

export default StudentsDashboard;
